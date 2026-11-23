# Worker API

Minimal **Hono + TypeScript + Cloudflare Workers** API with a single Ping endpoint. D1 and Drizzle configuration is retained for future development, but there are no business tables or migrations, and Ping does not access the database.

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

Add business route modules under `src/routes/` and register them in `src/routes/index.ts`. `src/index.ts` only creates the application, mounts the route collection, and handles unknown paths. Ping is defined in `src/routes/ping.ts`. Local changes reload automatically.

## D1 database

`wrangler.jsonc` retains the `DB` binding for the D1 database `iparty-database`. No current endpoint uses it. If you delete and recreate the cloud database, update `database_id` in `wrangler.jsonc` before deploying.

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
src/db/schema.ts       # Empty schema, ready for future table definitions
src/db/index.ts        # createDb(c.env.DB), shared by local and production
drizzle.config.ts     # SQLite schema and SQL output directory; no cloud credentials
migrations/            # Empty except for .gitkeep; future generated SQL goes here
```

The example `users` table, initial SQL migration, and Drizzle snapshots/journal have been removed. Start future migrations against an empty database; do not reuse an old database with the removed schema or migration history. Drizzle Kit will create its migration metadata when you generate the first business migration.

### Three commands

Run from the monorepo root:

| Command                                           | Effect                                                           | Cloud database access                                        |
| ------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `pnpm --filter @one/worker-api db:generate`       | Compare schema with Drizzle snapshots and generate new SQL files | None; does not change a database                             |
| `pnpm --filter @one/worker-api db:migrate:local`  | Apply pending migrations to local D1                             | None                                                         |
| `pnpm --filter @one/worker-api db:migrate:remote` | Apply pending migrations to cloud `iparty-database`              | **Writes to production; requires Cloudflare authentication** |

After adding table definitions, use `pnpm --filter @one/worker-api db:generate --name=init` to generate the first migration. Within `apps/worker-api`, you can use the short forms `pnpm db:generate`, `pnpm db:migrate:local`, and `pnpm db:migrate:remote`.

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
