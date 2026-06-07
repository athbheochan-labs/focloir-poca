# @focloir-poca/web

SvelteKit front-end for Foclóir Póca.

## Setup

```bash
# From monorepo root
npm install

# Copy env file and set the proxy URL
cp apps/web/.env.example apps/web/.env
```

The only env var required is:

| Variable       | Default                   | Description                     |
|----------------|---------------------------|---------------------------------|
| `VITE_API_URL` | `http://localhost:3001`   | Base URL of the NestJS proxy    |

## Development

```bash
# From monorepo root
npm run dev:web

# Or directly
npm run dev --workspace=apps/web
```

Runs on `http://localhost:5173` (increments if that port is taken).

## Build

```bash
npm run build --workspace=apps/web
```

Output goes to `apps/web/.svelte-kit/`. The adapter (`@sveltejs/adapter-auto`) detects the deployment platform automatically.
