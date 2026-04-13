# Lanobe Project Structure

This document describes the cleaned-up layout of the `Lanobe` repository and the responsibility of each major directory.

## Top-Level Layout

```text
.
|-- docs/
|   |-- PROJECT_STRUCTURE.md
|   |-- archive/
|   `-- deployment/
|-- public/
|-- scripts/
|   |-- dev/
|   `-- ...
|-- src/
|-- tests/
|   |-- e2e/
|   `-- unit/
|-- README.md
|-- package.json
|-- server.ts
`-- vite.config.ts
```

## Directory Responsibilities

### `src/`

Application source code.

- `pages/`: route-level pages such as home, bookshelf, and reader.
- `features/`: larger product flows composed from multiple components.
- `components/`: reusable UI pieces.
- `hooks/`: stateful browser and playback behavior.
- `services/`: API-facing logic.
- `store/`: Zustand state management.
- `lib/`: parser, pagination, chapter utilities, and text cleanup helpers.
- `i18n/`: UI copy and localized book metadata overrides.

### `public/`

Static assets served directly by Vite/Express.

- `books/`: built-in bookshelf metadata and volume text files.

### `scripts/`

Operational and maintenance scripts.

- `validate-built-in-books.mjs`: validates built-in book files against the current parser.
- `smoke-test.mjs`: boots the production server and checks `/health` and `/`.
- `migrate_makeine_volume.py`: content migration helper for the Makeine volumes.
- `dev/`: manual developer utilities that should not live in the repo root.

### `tests/`

Automated verification outside the main app source tree.

- `unit/`: small fast tests for helpers and isolated logic.
- `e2e/`: Playwright browser coverage for the bookshelf and reader flows.

### `docs/`

Repository documentation.

- `deployment/`: deployment and release instructions.
- `archive/`: historical planning notes kept for reference but no longer part of the active root layout.
- `PROJECT_STRUCTURE.md`: this file.

## Root File Roles

- `README.md`: project overview and primary developer entrypoint.
- `package.json`: scripts, dependencies, and repository metadata.
- `server.ts`: Express server, API endpoints, dev middleware, and production static hosting.
- `vite.config.ts`: Vite frontend build configuration.
- `playwright.config.ts`: browser-test configuration for the `tests/e2e` suite.
- `index.html`: browser entry HTML and default page metadata.
- `render.yaml`: historical alternate deployment config retained until hosting strategy is fully consolidated.
- `start-dev.bat`, `test-local.bat`, `deploy-azure-manual.bat`: Windows convenience entrypoints kept in the root because they are directly invoked by hand.

## Cleanup Rules

- New product or process documentation goes under `docs/`, not the repository root.
- New one-off developer utilities go under `scripts/dev/` unless they become part of CI or production workflows.
- New automated tests belong under `tests/`, not `scripts/`.
- Generated files, preview state, and local planning scratch files should stay out of Git.

## Naming

- Product name: `Lanobe`
- Repository package name: `lanobe`
- Browser title default: `Lanobe`
