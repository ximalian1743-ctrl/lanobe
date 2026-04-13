# Progress

## Task
- Name: Makeine TXT migration
- Goal: Migrate `public/books/makeine-too-many-heroines/volumes/volume-01.txt` ~ `volume-08.txt` to the new `ja:` / `zh:` / `word:` / `pause:` format with improved per-sentence translation alignment, furigana cleanup, and standardized character-name readings.

## Current status
- Phase: 2 - review `volume-01`, then continue `volume-02`
- State: in-progress
- Owner: 小西
- Last updated: 2026-03-26 01:23 JST

## Completed
- Located spec + 8 target volume files.
- Expanded `TXT_FORMAT_SPEC.md` with migration, ordering, translation/furigana, and Makeine name-reading rules.
- Created this progress checkpoint file.
- Added `scripts/migrate_makeine_volume.py` for deterministic legacy-to-new-format migration.
- Migrated `public/books/makeine-too-many-heroines/volumes/volume-01.txt` to `ja:` / `zh:` / `word:` / `pause:`.
- Fixed the known `佳樹[かじゅ]` reading issue in `volume-01` instances that appeared as `佳[か]樹[じゆ]` in legacy text.

## Next
- Start `volume-02.txt` with the same migration pipeline, then repeat structural validation + spot checks.

## Risks / blockers
- Current pass is structurally normalized and spot-checked, but not yet fully hand-polished line-by-line; some Chinese gloss phrasing still reflects source quality.
- Existing parser still expects legacy `jp:` blocks and will need a later follow-up phase.

## Validation
- `volume-01.txt` now contains only `ja:` / `zh:` / `word:` / `pause:` prefixes; no remaining `jp:` lines.
- Structural block check passed: 6226 entry blocks + 7 pause blocks, 0 malformed blocks.
- Spot-checked title/front-matter, dialogue split blocks, pause conversion, and the `佳樹` furigana correction.

## Checkpoints
- Latest commit: pending
- Important files: `TXT_FORMAT_SPEC.md`, `PROGRESS.md`, `scripts/migrate_makeine_volume.py`, `public/books/makeine-too-many-heroines/volumes/volume-01.txt`

## Resume
1. Read this file.
2. Run `git status`.
3. Inspect latest 3-5 commits.
4. Continue from **Next**.

---

## Session
- Date: 2026-04-13
- Goal: Restart project maintenance by doing a full repository review before any new implementation.
- Status: in-progress

### Actions
- Checked repository root structure and current Git status.
- Created `task_plan.md` and `findings.md` for this maintenance review.
- Read `README.md`, `package.json`, `PROGRESS.md`, `docs/archive/V1_DEV_PLAN.txt`, and `docs/archive/V1_UX_UPGRADE_BACKLOG.txt`.

### Early findings
- Project currently mixes app source, deployment artifacts, generated output, and temporary files in the root.
- Current npm entrypoint is `server.ts`, so runtime architecture should be validated from server/router wiring rather than assuming a frontend-only Vite app.
- Existing progress log points to an unfinished content-format migration that may affect current reader compatibility.
- Main route skeleton and local persistence goals from the old V1 plan have already landed in code.
- Some suspected mojibake turned out to be terminal encoding noise; real encoding residue is narrower and needs file-level verification before treating it as source corruption.
- The repository keeps both Azure-centric deployment docs/workflows and a leftover `render.yaml`, so the deployment story is no longer singular.

### Verification
- Ran `npm run test:local` successfully.
- Validation summary:
- Built-in books validation passed for all 8 volumes.
- TypeScript check passed.
- Production build passed.
- Smoke test passed against `http://127.0.0.1:4173`.

### Refined findings
- The earlier mojibake suspicion on `ReaderPage.tsx`, `BookshelfPage.tsx`, and built-in book metadata was a terminal encoding false alarm; UTF-8 content there is intact.
- Confirmed real encoding/copy residue exists in `vite.config.ts` comment and in the regex used by `src/hooks/useAudioQueue.ts` for stripping parenthetical readings.
- Confirmed current content format is mixed: volume 01 is on the new labeled format, volumes 02-08 remain legacy, but the parser currently handles both.
- Confirmed `.env.example` and the old Gemini / AI Studio env injection path were legacy leftovers.
- Confirmed the browser coverage could be upgraded into a real `tests/e2e` suite with a Playwright config instead of staying as a loose script.

### Maintenance work completed
- Renamed the package and default browser title to `Lanobe`.
- Moved deployment and historical planning docs under `docs/`.
- Moved root-level developer utilities into `scripts/dev/`.
- Moved the Playwright browser spec into `tests/e2e/` and added `playwright.config.ts`.
- Added `tests/unit/textCleanup.test.ts` and `src/lib/textCleanup.ts`.
- Fixed the broken parenthetical-reading cleanup used by `src/hooks/useAudioQueue.ts`.
- Removed the stale Gemini env injection from `vite.config.ts` and refreshed `.env.example`.
- Added `docs/PROJECT_STRUCTURE.md` to document the cleaned repository layout.

### Final verification
- `npm run test:e2e` passed after installing Playwright Chromium locally.
- `npm run test:local` passed with the new unit test included in the pipeline.
