# Lanobe

Lanobe is a full-stack Japanese light-novel reader and listening shelf, built for learners who want to consume raw Japanese text with on-demand help.

Core stack:

- Frontend: `Vite + React 19 + TypeScript 5 + Tailwind 4 + Zustand 5`
- Backend: `Express` in `server.ts` (`/health`, `/api/tts-batch`, `/api/ai-chat`)

Because it depends on backend APIs, static-only hosting (for example, only GitHub Pages) will not provide full functionality.

> 📦 **升级历程：** 2026-04-16 完成 5 轮系统化产品化升级（50 项改动 + 1 bonus fix），详见 [`CHANGELOG.md`](CHANGELOG.md)。

## 核心功能

- **阅读器** — 日中双语对照，Ruby 注音，沉浸模式（滚动自动隐藏 chrome），浮动 MiniPlayer，双击手势（中/左/右）
- **TTS 听书** — Microsoft Edge TTS 多语音多语速，可自定义播放序列（日文 / 中文 / 词汇对），独立"听书模式"大字界面
- **AI 讲解** — 兼容 OpenAI 协议，可按章批量讲解；划词查询；AI 讲解一键存为笔记
- **学习工具** — 书签、个人笔记、阅读时长统计、全书搜索、章节刻度进度条、N3+ 词汇注释
- **主题** — 深色 / 护眼 / 浅色 / 跟随系统四种模式
- **多端** — 响应式布局，PWA，自定义 TXT 上传，数据本地存储 + JSON 导出/导入

## Docs

- Changelog: [`CHANGELOG.md`](CHANGELOG.md) — 5 轮升级完整日志
- Project structure: [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md)
- Deployment guide: [`docs/deployment/DEPLOY.md`](docs/deployment/DEPLOY.md)
- Archived product notes: [`docs/archive/`](docs/archive)

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

- Unit tests
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
2. Deploy from GitHub on the current Node-capable hosting target
3. Attach custom domain `ximalian.cc.cd` in the deploy platform
4. Add DNS CNAME in your DNS provider to the platform target host

Note: If you deploy only the frontend to GitHub Pages, `/api/tts-batch` and `/api/ai-chat` will fail.
