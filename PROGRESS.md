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
