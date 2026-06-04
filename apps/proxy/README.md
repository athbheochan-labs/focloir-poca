# @focloir-poca/proxy

NestJS proxy service.

## Requirements

- Node.js >= 18
- npm >= 9

## Setup

### Install dependencies

From the monorepo root:

```bash
npm install
```

Or from this directory:

```bash
npm install
```

### Development

```bash
npm run dev
```

The server starts on port `3001` by default. Override with the `PORT` environment variable:

```bash
PORT=4000 npm run dev
```

### Production build

```bash
npm run build
npm run start
```

## Endpoints

| Method | Path      | Description        |
|--------|-----------|--------------------|
| GET    | `/health` | Returns `{"status":"ok"}` with HTTP 200 |

### Example

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```
