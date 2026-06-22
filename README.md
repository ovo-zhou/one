# one

Monorepo built with **pnpm** + **Turborepo**.

## Structure

```
one/
├── apps/
│   ├── nextjs/         # Next.js 15 App Router
│   ├── vite-react/     # Vite 6 + React 19
│   └── node-service/   # Express REST API
├── tsconfig.base.json  # Base TypeScript config
├── eslint.config.mjs   # ESLint flat config
├── turbo.json          # Turborepo pipeline
└── package.json        # Root workspace
```

## Getting Started

```bash
pnpm install
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm typecheck    # Type-check all apps
```

## Apps

| App | Port | Tech |
|-----|------|------|
| nextjs | 3000 | Next.js 15 + React 19 |
| vite-react | 3001 | Vite 6 + React 19 |
| node-service | 3002 | Express 5 |
