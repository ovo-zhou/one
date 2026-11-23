# one

Monorepo built with **pnpm** + **Turborepo**.

## Structure

```
one/
├── apps/
│   ├── nextjs/         # Next.js 15 App Router
│   ├── vite-react/     # Vite 6 + React 19
│   ├── node-service/   # Express REST API
│   ├── worker-api/     # Hono API on Cloudflare Workers
│   ├── iparty/         # Native WeChat Mini Program (TypeScript)
│   └── faceless/       # Faceless desktop app (Electron + React)
├── tsconfig.base.json  # Base TypeScript config
├── eslint.config.mjs   # ESLint flat config
├── turbo.json          # Turborepo pipeline
└── package.json        # Root workspace
```

## Getting Started

```bash
pnpm install
pnpm dev           # Start all apps in dev mode
pnpm dev:faceless  # Start Faceless in dev mode
pnpm dev:worker-api # Start the Workers API locally
pnpm build         # Build all apps
pnpm lint          # Lint all apps
pnpm typecheck     # Type-check all apps
```

For the iparty Mini Program, import `apps/iparty` into WeChat DevTools. See [its setup guide](apps/iparty/README.md) for AppID and API configuration.

## Install Faceless (macOS)

curl downloads the DMG without quarantine attribute, so no "app is damaged" warning.

```bash
curl -fsSL https://raw.githubusercontent.com/ovo-zhou/one/main/install.sh | bash
```

Or download the DMG manually: https://github.com/ovo-zhou/one/releases

## Apps

| App | Port | Tech |
|-----|------|------|
| nextjs | 3000 | Next.js 15 + React 19 |
| vite-react | 3001 | Vite 6 + React 19 |
| node-service | 3002 | Express 5 |
| [worker-api](apps/worker-api/README.md) | 8787 | Hono + Cloudflare Workers |
| [iparty](apps/iparty/README.md) | — | Native WeChat Mini Program + TypeScript |
| Faceless | — | Electron + React |
