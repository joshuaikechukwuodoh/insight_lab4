# Insighta Labs+ — Monorepo

This repository contains the Insighta Labs+ projects in a single **Bun workspaces** monorepo:

```
apps/
  web/    # Next.js (Vercel)
  api/    # Express API (currently Prisma-based)
  cli/    # Node CLI
packages/
  db/     # Drizzle schema + migrations (Postgres)
```

## Local setup

1. Create your env file:

```bash
cp .env.example .env
```

2. Install all dependencies:

```bash
bun install
```

3. Run apps:

```bash
# web
bun run dev:web

# api
bun run dev:api
```

## Deploy to Vercel (web)

Vercel supports monorepos. When importing the repo:

- Set **Root Directory** to `apps/web`
- Add env var **`INSIGHTA_API_BASE`** (point it to your deployed API base)

If you keep the API on a separate host (AWS/App Runner/etc), the web app will proxy `/api/*` to it via Next.js rewrites.

