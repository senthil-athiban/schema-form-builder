# Form Builder

Monorepo for the form builder app, API, and shared packages.

## Structure

```
apps/
  api/          # Express API (@form-builder/api)
  engine/       # BullMQ worker — workflows (@form-builder/engine)
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
cp packages/db/.env apps/engine/.env

# Optional: real webhook URL for seeded workflow (webhook.site)
# Add to packages/db/.env: SEED_WEBHOOK_URL=https://webhook.site/your-id

npm run db:up
npm run db:migrate
npm run db:seed
```

## Development

```bash
npm run dev          # API + web + engine
npm run dev:api      # API only (port 3001)
npm run dev:web      # Web only (Vite)
npm run dev:engine   # Workflow worker only
```

### Test workflow (Phase B)

1. Set `SEED_WEBHOOK_URL` in `packages/db/.env`, then `npm run db:seed`
2. Run `npm run dev:api` and `npm run dev:engine`
3. Submit the seeded contact form (`seed-contact-form`)
4. Check webhook.site and Prisma Studio (`WorkflowExecution`, `WorkflowStepExecution`)

## Database commands

| Command | Description |
|---------|-------------|
| `npm run db:up` | Start Postgres (Docker) |
| `npm run db:down` | Stop Postgres |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
