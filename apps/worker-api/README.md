# Worker API

Minimal **Hono + TypeScript + Cloudflare Workers** API. All routes are deployed as one Worker. The `DB` binding connects to the D1 database `iparty-database`; no database password is required.

## Local development

Run from the monorepo root:

```bash
pnpm install
pnpm dev:worker-api
```

Wrangler starts the local Workers runtime at `http://localhost:8787`.

| Method | Path         | Response                                     |
| ------ | ------------ | -------------------------------------------- |
| GET    | `/`          | `{ "message": "Hello World!" }`              |
| GET    | `/health`    | `{ "ok": true }`                             |
| GET    | `/db-check`  | `{ "ok": true }` after a successful D1 query |
| Any    | Unknown path | HTTP 404, `{ "error": "Not Found" }`         |

Edit `src/index.ts` to add routes. Local changes reload automatically.

## D1 database

`wrangler.jsonc` binds the existing cloud database `iparty-database` to `DB`. Access it from Hono handlers with `c.env.DB`. `/db-check` runs `SELECT 1 AS connected` and does not create tables or modify data.

- `pnpm dev:worker-api` uses a separate, local D1 database by default. Local data is stored in the Git-ignored `.wrangler/` directory, not synchronized to production.
- After deployment, the production Worker accesses the cloud database configured in `wrangler.jsonc`. Visit `/db-check` on the production URL to verify the cloud binding.
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
src/db/schema.ts       # Table definitions and inferred TypeScript types
src/db/index.ts        # createDb(c.env.DB), shared by local and production
drizzle.config.ts     # SQLite schema and SQL output directory; no cloud credentials
migrations/*.sql       # Reviewed, versioned schema changes consumed by Wrangler
migrations/meta/       # Drizzle snapshots/journal used to generate the next change
```

The initial migration creates a minimal example `users` table (`id`, `name`, unique optional `email`, `created_at`). No public user endpoints are added. If your existing database already has a `users` table, reconcile its schema and migration baseline before applying this migration; do not drop existing tables to force it through.

### Three commands

Run from the monorepo root:

| Command                                           | Effect                                                           | Cloud database access                                        |
| ------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `pnpm --filter @one/worker-api db:generate`       | Compare schema with Drizzle snapshots and generate new SQL files | None; does not change a database                             |
| `pnpm --filter @one/worker-api db:migrate:local`  | Apply pending migrations to local D1                             | None                                                         |
| `pnpm --filter @one/worker-api db:migrate:remote` | Apply pending migrations to cloud `iparty-database`              | **Writes to production; requires Cloudflare authentication** |

For a descriptive migration name, use `pnpm --filter @one/worker-api db:generate --name=add_user_avatar`. Within `apps/worker-api`, you can use the short forms `pnpm db:generate`, `pnpm db:migrate:local`, and `pnpm db:migrate:remote`.

### Development and release workflow

1. Edit `src/db/schema.ts`.
2. Run `db:generate` and review the generated SQL, especially any `DROP`, table rebuilds, or changes to existing data. The generator compares code snapshots, **not** the live local or cloud schema.
3. Run `db:migrate:local` and test locally. Applying migrations again should report no pending migrations.
4. Commit the schema, generated SQL, and `migrations/meta/` together. Never edit or rename an already-applied migration; create a new migration instead. Keep test/seed data separate from schema migrations.
5. For compatible additions, apply `db:migrate:remote` **before pushing schema-dependent application code to the production branch**, since that push automatically deploys the Worker. Authenticate first with `pnpm --filter @one/worker-api exec wrangler login` if needed. Review the target and confirmation prompt; the script deliberately does not pass `--yes`.
6. Push and let Workers Builds deploy. Neither `build`, `deploy`, `preview`, nor `dev` automatically runs migrations.

Do not treat Wrangler's prompt as a production safety lock: in non-interactive/CI contexts it may automatically confirm migrations even without `--yes`. Run `db:migrate:remote` deliberately from your terminal; do not add it to install hooks or build commands.

For breaking changes, use staged releases: add the new structure, deploy compatible code and migrate data, and only later remove old columns/tables. Before destructive production migrations, take a backup/check D1 Time Travel recovery and plan recovery explicitly. A failed release does not automatically roll back earlier successful migrations.

Local and production databases stay isolated. The same applied migration history keeps their intended schemas aligned only if you avoid out-of-band SQL changes. Inspect pending migrations when needed:

```bash
pnpm --filter @one/worker-api exec wrangler d1 migrations list DB --local
pnpm --filter @one/worker-api exec wrangler d1 migrations list DB --remote
```

### Use the ORM in a handler

```ts
import { createDb } from "./db";
import { users } from "./db/schema";

// Inside an authenticated handler, after applying the users migration:
const db = createDb(c.env.DB);
const rows = await db.select().from(users).limit(100);
```

Create the client from the current binding, not a global connection or hard-coded local SQLite file path. `/db-check` deliberately remains a table-independent connectivity check and does not validate business-table migrations.

## Validate without deploying

```bash
pnpm --filter @one/worker-api typecheck
pnpm --filter @one/worker-api lint
pnpm --filter @one/worker-api test
pnpm --filter @one/worker-api build
```

Tests exercise Hono routes directly and run the generated migration SQL plus ORM CRUD against a disposable local D1 database (`persist: false`, remote bindings disabled), without touching your development or production data. `build` bundles the Worker into `dist/` using Wrangler's dry-run mode; it does **not** deploy or require Cloudflare login. Use `dev` to test in the local Workers runtime.

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
