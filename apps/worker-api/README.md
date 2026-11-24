# Worker API

**Hono + TypeScript + Cloudflare Workers** API with D1 and Drizzle. Provides verified WeChat OpenID login, three-role authorization, merchant profiles, public staff cards, customer/merchant bookings, and platform shop moderation. Routes remain modular; no tests, test dependencies, or test scripts are included.

## Local development

Run from the monorepo root:

```bash
pnpm install
pnpm dev:worker-api
```

Wrangler starts the local Workers runtime at `http://localhost:8787`.

| Method | Path         | Response                             |
| ------ | ------------ | ------------------------------------ |
| GET    | `/ping`      | HTTP 200, `{ "message": "pong" }`    |
| Any    | Unknown path | HTTP 404, `{ "error": "Not Found" }` |

Business routes:

| Method     | Path                                   | Access                                                               |
| ---------- | -------------------------------------- | -------------------------------------------------------------------- |
| POST       | `/api/v1/auth/wechat`                  | WeChat login code verified by the backend                            |
| GET        | `/api/v1/auth/me`                      | Current authenticated account ID and database role                   |
| GET        | `/api/v1/merchant/profile`             | Bearer session, own shop only                                        |
| PUT        | `/api/v1/merchant/profile`             | Bearer session, atomically publish own shop and staff                |
| PUT        | `/api/v1/merchant/shop`                | Bearer session, update own shop fields only                          |
| PUT        | `/api/v1/merchant/staff`               | Bearer session, save one staff record in own shop                    |
| DELETE     | `/api/v1/merchant/staff/:id`           | Bearer session, remove own staff by client ID                        |
| GET        | `/api/v1/public/staff/:id`             | Public, presentation fields only                                     |
| POST / GET | `/api/v1/customer/bookings`            | Any active account; create / list own bookings                       |
| GET        | `/api/v1/customer/bookings/:id`        | Booking customer only                                                |
| PUT        | `/api/v1/customer/bookings/:id/cancel` | Customer; cancel pending or confirmed booking                        |
| GET        | `/api/v1/merchant/bookings`            | Merchant; received bookings in own shop only                         |
| PUT        | `/api/v1/merchant/bookings/:id/status` | Merchant; guarded status transition in own shop                      |
| GET        | `/api/v1/admin/shops`                  | Super admin; name search (`q`), optional `status=active/disabled`    |
| GET        | `/api/v1/admin/shops/:id`              | Super admin; internal shop and staff detail, including stopped shops |
| PUT        | `/api/v1/admin/shops/:id/status`       | Super admin; `{ status, reason, version }`                           |
| GET        | `/api/v1/admin/shops/:id/audit`        | Super admin; paginated shop moderation history                       |

Private merchant profile reads/edits and received bookings allow `merchant` and `super_admin`, always scoped to the authenticated account's own shop. Initial profile publication allows `customer` and `merchant`, not `super_admin`; admins edit their existing shop through the independent shop/staff endpoints without changing their role. A missing admin shop is an account configuration error, not an invitation to create a shop. All list endpoints use `{ items, next }`, default `limit=20` (maximum 50), and paired `before`/`afterId` cursor parameters. Bookings and audit logs sort by descending creation time and ID; shops sort by descending update time and ID. Shop pagination is a live view, not a frozen snapshot: concurrent edits may move rows between pages; refresh to reconcile.

## WeChat login

1. `wrangler.jsonc` contains the Mini Program's `WECHAT_APP_ID`; it must match `apps/iparty/project.config.json`.
2. For local development, copy `.dev.vars.example` to `.dev.vars` and fill in `WECHAT_APP_SECRET`. Never commit real secrets or place them in the Mini Program.
3. Run `pnpm --filter @one/worker-api db:migrate:local` before using authentication or merchant routes.
4. For production, set the Worker secret using `pnpm --filter @one/worker-api exec wrangler secret put WECHAT_APP_SECRET`. Review the cloud D1 target, then deliberately run `db:migrate:remote` before deploying the new API code. These cloud operations are not performed automatically.
5. Configure privacy disclosures and any required WeChat server IP allowlist. Phone-number capability is not required; personal-subject Mini Programs can use this login flow.

The client calls `wx.login` on explicit account actions such as “创建我的店铺”, viewing own bookings, or submitting a booking, without a login dialog, then sends `{ "loginCode": "..." }` to `POST /api/v1/auth/wechat`. The backend exchanges it using `jscode2session` and stores verified `openid` and `app_id` in `users`. Never trust a client-supplied OpenID. Identity is keyed by `(app_id, openid)`; new accounts default to `customer`. Responses contain `{ token, expiresAt, user: { id, role } }`, not OpenID. Account phone is nullable and not obtained or overwritten during login. Public shop phone is separately merchant-entered, not a verified credential. Random tokens expire after 30 days and are stored only as SHA-256 hashes in D1. Every private request checks the current database role and active account status, so role revocation applies to subsequent requests without waiting for token expiry. Auth attempts are capped at 30 per IP per fixed five-minute window. Private responses are not cached. Never log authorization codes, tokens, booking contacts, or upstream identity payloads.

Merchant publication replaces the current shop's staff collection and upgrades `customer` to `merchant` in one atomic D1 batch; failed publication cannot leave only a role upgrade. At most 50 staff are accepted. One owner has one shop. Staff are presentation records, not login accounts. Draft IDs are owner-scoped and mapped to stable public IDs; the client cannot pick another merchant's shop or public IDs. Later shop/staff edits are independent. Publication and editing preserve moderation status and never restore a stopped shop.

The Mini Program homepage and shared center never request identity from lifecycle hooks. A locally valid session with a complete account navigates directly to “我的中心” for all three roles. No session displays a creation link; expired or incomplete sessions display an enter-center link without onboarding steps. Only clicking these links restores an existing account; incomplete sessions may fetch `/auth/me` then. Customers see personal bookings and a creation link, merchants see four customer/shop cards, and super admins see those four plus platform shop management, with no creation link. Feature permissions are centralized in the client; backend authorization and ownership checks remain authoritative. Concrete editors/lists load data on demand. There is no separate admin center, automatic registration from browsing, account-ID display or manual identity-refresh control. Shared cards stay public. Booking and publication success go to the same shared center.

On an explicit entry click without a locally valid token, restoration sends `{ "loginCode": "...", "existingOnly": true }`: an existing active account receives a session, while an unknown identity receives `{ "session": null }` without registration. New visitors then enter onboarding; a previously stored account that no longer exists has its stale session cleared and switches to the creation entry with a notice. Other failures remain retryable inline without a full-page loader. Omitting `existingOnly` allows registration only for final onboarding submission or explicit booking submission, not browsing or entry lookup. Registration precedes shop publication, so a failed publication may retain a customer account but never a partial merchant promotion. Private requests restore existing accounts when needed and retry a request at most once after `401`; they never register visitors. Concurrent login attempts share one identity exchange, and a late `401` for an old token cannot clear a newer session. Network failures, timeouts, and non-`401` responses are not automatically retried. Public staff viewing requires no login.

## Booking and moderation rules

- Booking creation takes `{ staffId, contactName, contactPhone, requestedAt, note, requestKey, consent: true }`. `requestKey` is a UUID; time is an epoch-millisecond integer in the next 90 days. The Mini Program interprets and displays date/time as **UTC+8**. Contact names are limited to 40 characters, phone to 7–25 allowed characters, notes to 500 characters.
- Accounts cannot create bookings for personnel in their own shop, regardless of role. Ownership is checked server-side and enforced again inside the atomic insert; self-booking returns `403` with `不能预约自己店铺的服务人员`. Merchants can still book other shops. Historical records remain unchanged; an identical idempotent replay of an existing record returns its original ID without creating another booking.
- A guarded insert snapshots shop/personnel data only while the staff record exists and shop/owner are active. Each customer may create at most 10 bookings in a rolling hour. Idempotency is scoped to `(customer_id, request_key)`: identical normalized payload retries return the existing ID, changed payload returns `409`. A replay does not count toward the limit and may return an existing booking after the shop is stopped. New keys represent new applications, not deduplication by time slot.
- State machine: `pending → confirmed → completed`, or `pending → rejected`; customers can change `pending`/`confirmed` to `cancelled`. Conditional updates protect against simultaneous cancellation/confirmation/completion. Terminal states cannot be reopened. This is intent collection, not scheduling, slot reservation, payment, or automatic notification.
- Booking records retain submission-time shop/staff/contact snapshots after staff deletion. Customers can only access their own records; merchants can only access received bookings in their own shop. Super admins have no platform-wide customer booking endpoint in this version.
- Shop `disabled` blocks public cards, new bookings, and confirming pending applications. It does not disable the owner: editing, rejecting pending requests, completing confirmed bookings, and using customer features remain available. Account `disabled` instead blocks all private authentication and the owner's public cards.
- Moderation requires `{ status: 'active' | 'disabled', reason: nonempty string (max 300), version: moderationVersion }`. Status change and its actor/reason/previous/next audit entry are atomic; stale/same-state submissions return `409`, not duplicate logs. Admin details include disabled shops; no impersonation, direct business-data editing, bulk export, or role-management API is provided.
- Configure platform privacy disclosures and operator retention/deletion procedures for OpenID, public profiles, customer contacts, requested time, notes, and disclosure to the corresponding merchant. Explicit booking consent is required by the API; this does not replace WeChat privacy configuration or an operational deletion policy. Automatic retention cleanup and self-service historical booking deletion are not implemented.

## Super-admin provisioning

No account is automatically granted admin access during login or shop creation. First have the intended person publish their own shop as a merchant. An authorized developer/operator can obtain only the account ID from the verified login response's `user.id` or authenticated `/api/v1/auth/me` response; the UI does not display it. Do not copy or share the full response containing a token. **Confirm the person, exact ID, AppID, owned shop, and intended local/cloud environment out of band**; names and phone numbers are not authority. Promotion preserves their existing shop, staff and bookings. Apply all migrations first and back up the intended database. The following are operator examples, not commands run by application startup:

```sql
-- Inspect the exact candidate without dumping OpenIDs, tokens, or contact data.
SELECT id, app_id, role, status FROM users WHERE id = '<verified-account-id>';
-- Grant only an active, explicitly verified account in the expected app.
UPDATE users SET role = 'super_admin', updated_at = <current-epoch-ms>
WHERE id = '<verified-account-id>' AND app_id = '<expected-app-id>'
  AND status = 'active' AND role = 'merchant'
  AND EXISTS (SELECT 1 FROM shops WHERE shops.owner_id = users.id);
SELECT changes(); -- Must be exactly 1; stop and investigate otherwise.
```

Run reviewed SQL via `pnpm --filter @one/worker-api exec wrangler d1 execute DB --local --file <reviewed.sql>`. Using `--remote` instead writes cloud D1 and requires explicit authorization and Cloudflare authentication; never use it as an exploratory command. Confirm the resulting role with another exact-ID query. Record who approved and executed the grant, target environment/account, and time in the operator's restricted change log (the shop audit table does not cover manual role SQL). Log in again to update the client's navigation cache and see platform management in the shared center. During local development, remove only `iparty:session:http://localhost:8787` from Mini Program Storage, recompile, then explicitly click the homepage entry to restore the existing account with its current role; do not clear unrelated drafts. Existing tokens are not themselves admin credentials.

To revoke while retaining legitimate shop access, derive the replacement role from ownership, not a remembered client role:

```sql
UPDATE users SET role = CASE
  WHEN EXISTS (SELECT 1 FROM shops WHERE owner_id = users.id) THEN 'merchant'
  ELSE 'customer' END, updated_at = <current-epoch-ms>
WHERE id = '<verified-account-id>' AND app_id = '<expected-app-id>'
  AND role = 'super_admin';
SELECT changes();
-- Optional incident response: revoke every session for this exact account.
DELETE FROM sessions WHERE user_id = '<verified-account-id>';
```

Role revocation applies on the next server request, even with an unexpired token. Deleting sessions alone does not disable the account: it can log in again with the new role. Account-wide suspension requires a separately reviewed exact-account `status='disabled'` change and blocks customer/merchant functions too. Do not suspend an account merely to stop its shop.

Add business route modules under `src/routes/` and register them in `src/routes/index.ts`. `src/index.ts` only creates the application, mounts the route collection, and handles unknown paths. Ping is defined in `src/routes/ping.ts`. Local changes reload automatically.

## D1 database

`wrangler.jsonc` uses the `DB` binding for the D1 database `iparty-database`. If you delete and recreate the cloud database, update `database_id` in `wrangler.jsonc` before deploying. Ping does not require database access.

- `pnpm dev:worker-api` uses a separate, local D1 database by default. Local data is stored in the Git-ignored `.wrangler/` directory, not synchronized to production.
- Deleting local state or repository migration files does not reset the cloud database. Cloud database cleanup is a separate, manual operation.
- Deploying Worker code does not create business tables or copy local data to the cloud. Apply schema changes separately to the intended database.
- Preview resources may be isolated from production; do not assume a successful preview verifies the production database.

Runtime and binding types are generated in `worker-configuration.d.ts`. After changing bindings or the compatibility date, regenerate them from the repository root:

```bash
pnpm --filter @one/worker-api types
```

Commit the generated declaration along with configuration changes.

## ORM and schema migrations

Drizzle ORM handles typed queries, Drizzle Kit generates SQL from the TypeScript schema, and Wrangler applies the SQL to D1. Only Wrangler manages the database migration history (`d1_migrations`); do not mix it with `drizzle-kit migrate`, `drizzle-kit push`, or an application-startup migrator.

```text
src/db/schema.ts       # users, sessions, shops, staff, auth_rate_limits, bookings, admin_audit_logs
src/db/index.ts        # createDb(c.env.DB), shared by local and production
drizzle.config.ts     # SQLite schema and SQL output directory; no cloud credentials
migrations/            # Reviewed SQL and Drizzle metadata
```

`0000_init.sql` is the fresh development baseline generated directly from the current schema. It creates all seven application tables, indexes and foreign keys, including nullable account phone, the default `customer` role, bookings and shop moderation/audit fields. It contains no legacy phone conversions or role mappings and creates no accounts or seed data.

The old development migration chain was replaced during an explicitly authorized **local-only database reset**. This baseline is for an empty database, **not an upgrade path for a cloud database containing an older schema or migration history**. Do not apply it to an existing cloud database, delete cloud migration records, or assume an old cloud schema matches it. Any future cloud upgrade/reset requires separate inspection, backup and approval. No cloud reset or migration was part of the local reset.

### Rebuild local development data

For an explicitly approved local reset:

1. Stop the local Worker so it cannot write to D1 during the reset.
2. Confirm that all local application data and migration history may be discarded. The current local reset policy is to create no backup; do not copy account, session or contact data elsewhere.
3. Delete **only** `apps/worker-api/.wrangler/state/v3/d1/`. This clears local application data and Wrangler's local `d1_migrations` records; leave other `.wrangler` state, configuration and secrets intact. Keep the checked-in initialization SQL and Drizzle metadata for a normal data reset.
4. Run `pnpm --filter @one/worker-api db:migrate:local`, then run it again to verify there are no pending migrations. The result is an empty database with the current schema; it has no administrator account.
5. Restart with `pnpm dev:worker-api`. In the Mini Program console, remove only the development login cache with `wx.removeStorageSync("iparty:session:http://localhost:8787")`, then recompile and log in/create a shop again. Existing share IDs no longer resolve. Do not clear all Storage if you want to retain onboarding drafts.

This procedure never uses `--remote`. Do not regenerate or rewrite the baseline on every data reset; future schema changes should produce new migrations.

Only when explicitly authorized to regenerate the local baseline as well, remove the old migration SQL and `migrations/meta/` files and its now-empty directory, retain `.gitkeep`, and run `pnpm --filter @one/worker-api db:generate --name=init` before applying local migrations. This recreates a single initialization migration and fresh Drizzle metadata; it does not make the baseline safe for an existing cloud database.

### Three commands

Run from the monorepo root:

| Command                                           | Effect                                                           | Cloud database access                                        |
| ------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `pnpm --filter @one/worker-api db:generate`       | Compare schema with Drizzle snapshots and generate new SQL files | None; does not change a database                             |
| `pnpm --filter @one/worker-api db:migrate:local`  | Apply pending migrations to local D1                             | None                                                         |
| `pnpm --filter @one/worker-api db:migrate:remote` | Apply pending migrations to cloud `iparty-database`              | **Writes to production; requires Cloudflare authentication** |

The initial migration is already checked in. For future schema changes, use `pnpm --filter @one/worker-api db:generate --name=<change_name>` to generate the next migration. Within `apps/worker-api`, you can use the short forms `pnpm db:generate`, `pnpm db:migrate:local`, and `pnpm db:migrate:remote`.

### Development and release workflow

1. Edit `src/db/schema.ts`.
2. Run `db:generate` and review the generated SQL, especially any `DROP`, table rebuilds, or changes to existing data. The generator compares code snapshots, **not** the live local or cloud schema.
3. Run `db:migrate:local` and test locally. Applying migrations again should report no pending migrations.
4. Commit the schema, generated SQL, and `migrations/meta/` together. Never edit or rename an already-applied migration; create a new migration instead. Keep test/seed data separate from schema migrations.
5. Only after the target cloud database has been separately verified to use this baseline/history, apply compatible additions with `db:migrate:remote` **before pushing schema-dependent application code to the production branch**, since that push automatically deploys the Worker. An older cloud database needs a separately approved migration plan first. Authenticate with `pnpm --filter @one/worker-api exec wrangler login` if needed. Review the target and confirmation prompt; the script deliberately does not pass `--yes`.
6. Push and let Workers Builds deploy. Neither `build`, `deploy`, `preview`, nor `dev` automatically runs migrations.

Do not treat Wrangler's prompt as a production safety lock: in non-interactive/CI contexts it may automatically confirm migrations even without `--yes`. Run `db:migrate:remote` deliberately from your terminal; do not add it to install hooks or build commands.

For breaking changes, use staged releases: add the new structure, deploy compatible code and migrate data, and only later remove old columns/tables. Before destructive production migrations, take a backup/check D1 Time Travel recovery and plan recovery explicitly. A failed release does not automatically roll back earlier successful migrations.

Local and production databases stay isolated. Their intended schemas align only when both have the same baseline and applied migration history and you avoid out-of-band SQL changes; this local reset does not establish that for cloud D1. Inspect pending migrations when needed (a list alone does not validate an existing schema):

```bash
pnpm --filter @one/worker-api exec wrangler d1 migrations list DB --local
pnpm --filter @one/worker-api exec wrangler d1 migrations list DB --remote
```

For future database operations, use `createDb(c.env.DB)` from `src/db/index.ts`. Create the client from the current binding, not a global connection or hard-coded local SQLite file path.

## Validate without deploying

```bash
pnpm --filter @one/worker-api typecheck
pnpm --filter @one/worker-api lint
pnpm --filter @one/worker-api build
```

`build` bundles the Worker into `dist/` using Wrangler's dry-run mode; it does **not** deploy or require Cloudflare login. Use `dev` to run in the local Workers runtime.

## Automatic deployment from GitHub

1. Push this monorepo to GitHub.
2. In Cloudflare, select the existing Worker, then **Settings → Builds → Connect** and select the repository. Alternatively, create a Worker by importing the repository.
3. Configure:

   | Setting           | Value                                                      |
   | ----------------- | ---------------------------------------------------------- |
   | Production branch | `main` (or your actual production branch)                  |
   | Build command     | Leave empty; Wrangler bundles TypeScript during deployment |
   | Deploy command    | `pnpm --filter @one/worker-api exec wrangler deploy`       |
   | Preview command   | `pnpm --filter @one/worker-api exec wrangler preview`      |

   These commands assume execution from the repository root. No build output directory is required for this API: Wrangler reads `apps/worker-api/wrangler.jsonc` and bundles `src/index.ts`. If the dashboard does not show a root-directory setting, the filtered commands above select the app without it. If you previously configured a root directory, reset it to the repository root when using these commands.

   When preview builds are enabled, pushes to non-production branches use the preview command to produce a Preview URL without replacing the production deployment. The default current Wrangler preview command is `wrangler preview`, not `wrangler dev` (which starts the local server).

4. Ensure `name` in `wrangler.jsonc` exactly matches the Worker name in Cloudflare. This project uses `iparty-server`.
5. Push a commit to the production branch. Workers Builds installs dependencies and deploys the new version. Keep the root `pnpm-lock.yaml` and `pnpm-workspace.yaml` committed.

The deployed API is available at `https://<worker-name>.<your-subdomain>.workers.dev`. No custom domain is needed. GitHub Actions is not required.

For builds only when this app changes, set include watch paths to `apps/worker-api/*` (remove the default `*`) and leave excludes empty. This includes schema and migration files. Optionally add `pnpm-lock.yaml` and `pnpm-workspace.yaml` to rebuild on shared dependency changes too. Paths are relative to the repository root, without a leading `/`.

## Manual deployment (optional)

From the monorepo root:

```bash
pnpm --filter @one/worker-api exec wrangler login
pnpm --filter @one/worker-api deploy
```

After enabling Git deployments, treat the repository as the source of truth: changes made only in the dashboard editor can be overwritten on the next deployment.

Store runtime secrets with Workers Secrets, not in Git. For local development, `.dev.vars` is ignored by Git.
