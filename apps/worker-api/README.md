# Worker API

Minimal **Hono + TypeScript + Cloudflare Workers** API. All routes are deployed as one Worker; no database, secrets, or paid services are required for this template.

## Local development

Run from the monorepo root:

```bash
pnpm install
pnpm dev:worker-api
```

Wrangler starts the local Workers runtime at `http://localhost:8787`.

| Method | Path         | Response                             |
| ------ | ------------ | ------------------------------------ |
| GET    | `/`          | `{ "message": "Hello World!" }`      |
| GET    | `/health`    | `{ "ok": true }`                     |
| Any    | Unknown path | HTTP 404, `{ "error": "Not Found" }` |

Edit `src/index.ts` to add routes. Local changes reload automatically.

## Validate without deploying

```bash
pnpm --filter @one/worker-api typecheck
pnpm --filter @one/worker-api lint
pnpm --filter @one/worker-api test
pnpm --filter @one/worker-api build
```

Tests exercise Hono routes directly. `build` bundles the Worker into `dist/` using Wrangler's dry-run mode; it does **not** deploy or require Cloudflare login. Use `dev` to test in the local Workers runtime.

## Automatic deployment from GitHub

1. Push this monorepo to GitHub.
2. In Cloudflare, select the existing Worker, then **Settings → Builds → Connect** and select the repository. Alternatively, create a Worker by importing the repository.
3. Configure:

   | Setting           | Value                                                      |
   | ----------------- | ---------------------------------------------------------- |
   | Production branch | `main` (or your actual production branch)                  |
   | Root directory    | `apps/worker-api`                                          |
   | Build command     | Leave empty; Wrangler bundles TypeScript during deployment |
   | Deploy command    | `pnpm exec wrangler deploy`                                |

4. Ensure `name` in `wrangler.jsonc` exactly matches the Worker name in Cloudflare. The template uses `worker-api`; change it if connecting to an existing Worker with a different name.
5. Push a commit to the production branch. Workers Builds installs dependencies and deploys the new version. Keep the root `pnpm-lock.yaml` and `pnpm-workspace.yaml` committed.

The deployed API is available at `https://<worker-name>.<your-subdomain>.workers.dev`. No custom domain is needed. GitHub Actions is not required.

If you enable build watch paths, include this app plus `/pnpm-lock.yaml` and `/pnpm-workspace.yaml`, so dependency changes trigger builds too.

## Manual deployment (optional)

From the monorepo root:

```bash
pnpm --filter @one/worker-api exec wrangler login
pnpm --filter @one/worker-api deploy
```

After enabling Git deployments, treat the repository as the source of truth: changes made only in the dashboard editor can be overwritten on the next deployment.

Store runtime secrets with Workers Secrets, not in Git. For local development, `.dev.vars` is ignored by Git.
