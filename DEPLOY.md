# Deploy Guide (`ximalian.cc.cd`)

This project is full-stack (`React + Express`), so use a Node host for production.

## 1) Create a standalone Git repo for this folder

From `E:\OpenClawWorkspace\gemini-lanobe`:

```bash
git init
git add .
git commit -m "chore: initial deploy-ready setup"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

## 2) Deploy from GitHub (example: Render)

1. Create a new Web Service in Render
2. Connect your GitHub repo
3. Use these commands:

- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`

4. Enable Auto Deploy on push to `main`

`render.yaml` is already provided in this repo.

## 3) Bind custom domain `ximalian.cc.cd`

1. In Render service settings, add custom domain: `ximalian.cc.cd`
2. Copy Render's target hostname (example: `your-app.onrender.com`)
3. In your DNS provider, add:

- Type: `CNAME`
- Name/Host: `ximalian`
- Target: `your-app.onrender.com`
- Proxy: DNS only (or platform-recommended mode)

4. Wait for SSL certificate provisioning to complete

## 4) Verify

After DNS propagation:

- `https://ximalian.cc.cd/` should open the app
- `https://ximalian.cc.cd/health` should return JSON status
- Upload a `.txt` file and test playback

## 5) Local one-command test

```bash
npm run test:local
```

This validates lint + build + production startup + smoke checks.
