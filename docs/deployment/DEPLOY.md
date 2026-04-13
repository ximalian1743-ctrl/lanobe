# Lanobe Deploy Guide (`ximalian.cc.cd`)

This project now uses:

- Local development on your Windows machine
- GitHub as the source of truth
- GitHub Actions for CI and Azure deployment
- Azure App Service for hosting
- Cloudflare for DNS and public HTTPS

## Daily workflow

Use this release flow for normal development:

1. Double-click `start-dev.bat`
2. Develop locally and test in the browser
3. Double-click `test-local.bat`
4. If the test passes, commit and push to `main`
5. GitHub Actions will automatically deploy the pushed commit to Azure
6. Verify the production site:
   - `https://ximalian.cc.cd/`
   - `https://ximalian.cc.cd/health`

## Local commands

- Start local development: `npm run dev`
- Local verification: `npm run test:local`

The local verification command runs:

- Unit tests
- TypeScript check
- Production build
- Smoke test

## GitHub Actions

There are now two workflows:

- `CI`
  - Runs on pull requests
  - Runs on branch pushes except `main`
  - Used for validation only
- `Deploy Azure Web App`
  - Runs on pushes to `main`
  - Runs the same validation
  - Deploys the exact pushed commit to Azure by OIDC login
  - Does not require a publish profile secret

## Why this is the recommended flow

This keeps all three environments aligned:

- Local machine is your fast feedback environment
- GitHub is the version history and source of truth
- Azure is the production runtime

That means you should not treat Azure as your development environment.

## One-click files

- `start-dev.bat`
  - Starts the local dev server
  - Installs dependencies automatically if needed
  - Opens `http://localhost:3000`
- `test-local.bat`
  - Runs the full local verification before release
- `deploy-azure-manual.bat`
  - Fallback manual deploy from this machine
  - Useful only if GitHub Actions is temporarily failing

## Manual fallback deploy

If GitHub Actions is temporarily unavailable, you can still deploy manually from this folder with Azure CLI:

```powershell
git archive --format=zip --output deploy.zip HEAD
az webapp deploy --resource-group rg-lanobe-japaneast --name lanobe-jpe-764788 --src-path deploy.zip --type zip --restart true --track-status true
```

## Current production target

- Azure Web App: `lanobe-jpe-764788`
- Azure Resource Group: `rg-lanobe-japaneast`
- Public domain: `ximalian.cc.cd`
- Public HTTPS: Cloudflare edge certificate

## Expected deployment time

For normal small updates:

- Local test: about 15 to 30 seconds
- GitHub Actions validation + Azure deploy: usually about 2 to 5 minutes
- Slower Azure/Oryx runs can take about 5 to 10 minutes
