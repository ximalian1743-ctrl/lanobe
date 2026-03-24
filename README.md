# Gemini Lanobe

This is a full-stack app:

- Frontend: `Vite + React`
- Backend: `Express` in `server.ts` (`/health`, `/api/tts-batch`, `/api/ai-chat`)

Because it depends on backend APIs, static-only hosting (for example, only GitHub Pages) will not provide full functionality.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production assets:

```bash
npm run build
```

4. Run production server:

```bash
npm run start
```

## One-Command Local Test

Run:

```bash
npm run test:local
```

This command runs:

- Type check
- Production build
- Starts server in production mode
- Smoke checks `/health` and `/`

Defaults:

- Smoke test port: `4173`
- Smoke test timeout: `45000ms`

Override example:

```bash
SMOKE_PORT=5000 SMOKE_TIMEOUT_MS=60000 npm run test:local
```

## GitHub and Deployment

Recommended flow:

1. Push this project to GitHub
2. Deploy from GitHub on a Node-capable platform (Render, Railway, Fly.io, etc.)
3. Attach custom domain `ximalian.cc.cd` in the deploy platform
4. Add DNS CNAME in your DNS provider to the platform target host

Note: If you deploy only the frontend to GitHub Pages, `/api/tts-batch` and `/api/ai-chat` will fail.
