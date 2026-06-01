# Form Builder

Monorepo for the form builder app, API, and shared packages.

## Structure

```
apps/
  api/          # Express API (@form-builder/api)
  web/          # Vite + React frontend (@form-builder/web)
packages/
  db/           # Prisma schema, migrations, client (@form-builder/db)
  shared/       # Shared types, queue contracts (@form-builder/shared)
```

## Prerequisites

- Node.js 20+
- Docker (for Postgres)

## Setup

```bash
npm install

# Database URL for Prisma CLI and API (copy to both locations or symlink)
cp packages/db/.env.example packages/db/.env
cp packages/db/.env apps/api/.env

npm run db:up
npm run db:migrate
npm run db:seed
```

## Development

```bash
npm run dev          # API + web
npm run dev:api      # API only (port 3001)
npm run dev:web      # Web only (Vite)
```

## Database commands

| Command | Description |
|---------|-------------|
| `npm run db:up` | Start Postgres (Docker) |
| `npm run db:down` | Stop Postgres |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
