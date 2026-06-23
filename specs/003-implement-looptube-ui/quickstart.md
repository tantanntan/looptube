# Quickstart: LoopTube UI — 003-implement-looptube-ui

**Phase**: 1 | **Date**: 2026-06-22 | **Plan**: [plan.md](./plan.md)

## Prerequisites

- Node.js 18+ or Bun 1.x
- npm or pnpm (project uses npm by default per constitution)
- Python 3.x + `fonttools` (for font subsetting — one-time setup)

## 1. Clone and Install

```bash
git clone <repo>
cd yt-repeater
git checkout 003-implement-looptube-ui
npm install
```

## 2. FR-016 Gate: Export Design Artefacts (Required Before Implementation)

Before writing any implementation code, the design artefacts must be committed:

```bash
# Export LoopTube.dc.html and screenshots from claude.ai design project
# (claude.ai design project: 22934576-e45f-4f40-ad9a-5a47dbc2260a)
# Commit them to:
specs/003-implement-looptube-ui/design-refs/LoopTube.dc.html
specs/003-implement-looptube-ui/design-refs/*.png   # reference screenshots
```

Implementation tasks that depend on the visual reference MUST NOT start until this
directory contains at least `LoopTube.dc.html`.

## 3. Font Subsetting (One-Time Setup)

```bash
pip install fonttools brotli   # or: pip3 install fonttools brotli

# After extracting font files from design project uploads/ to tmp/fonts/:
scripts/subset-fonts.sh        # outputs subsetted .woff2 to static/fonts/
```

The subsetted fonts are committed to `static/fonts/` and do not require CI rebuilding.

## 4. Development Server

```bash
npm run dev
# → http://localhost:5173
```

The dev server runs with SSR enabled. Open the app and paste a YouTube video ID to test.

## 5. Running Tests

### Unit + Integration (Vitest)

```bash
npm run test:unit              # run unit tests once
npm run test:unit:watch        # watch mode
npm run test:integration       # run integration tests once
npx vitest run --coverage      # coverage report (must be 100% for core modules)
```

Key test files for this feature:

| File | What it tests |
|------|---------------|
| `tests/unit/ABLoopStateMachine.test.ts` | Updated: finite-loop completion keeps LOOPING state |
| `tests/unit/i18n.test.ts` | NEW: parseLocale, createTranslator, key fallback |
| `tests/unit/Timeline.drag.test.ts` | NEW: clampPointA, clampPointB, computeZoomWindow, pxToSeconds |
| `tests/unit/ZoomState.test.ts` | NEW: computeZoomWindow edge cases |
| `tests/unit/locale-detector.test.ts` | NEW: Accept-Language parsing |

### E2E (Playwright)

```bash
npm run test:e2e               # requires dev server or preview server
npx playwright test --ui       # interactive mode
```

Key E2E scenarios:
- Drag A/B markers in full-video and zoom mode
- Zoom toggle shows/hides correctly
- Inline delete confirm flow
- Locale detection (run with Accept-Language: ja header)

## 6. Constitution Compliance Checklist (per PR)

Each PR description must include a "Constitution Check" section confirming:

- [ ] TDD: failing tests committed before implementation code
- [ ] VideoPlayerPort: no new YouTube SDK direct references
- [ ] Pure Domain Logic: ABLoopStateMachine change has zero DOM/Svelte dependencies
- [ ] StoragePort: SegmentRepository and adapters unchanged
- [ ] 4-port DI: no new singletons; locale passed as prop/parameter
- [ ] Coverage gate: `npx vitest run --coverage` passes 100% for core modules
- [ ] TypeScript strict: `tsc --noEmit` exits 0
- [ ] Lint: `npm run lint` exits 0 (no boundary violations)
- [ ] FR-016: `specs/003-implement-looptube-ui/design-refs/LoopTube.dc.html` exists

## 7. Key File Locations

| Area | Path |
|------|------|
| ABLoopStateMachine (targeted change) | `src/lib/core/ABLoopStateMachine.ts` |
| SSR locale detection (server load) | `src/routes/+page.server.ts` |
| i18n module (new) | `src/lib/i18n/index.ts` |
| English strings | `src/lib/i18n/en.json` |
| Japanese strings | `src/lib/i18n/ja.json` |
| Timeline component (new) | `src/lib/components/Timeline.svelte` |
| LoopList component (new) | `src/lib/components/LoopList.svelte` |
| LoopTubeHeader (new) | `src/lib/components/LoopTubeHeader.svelte` |
| Self-hosted fonts | `static/fonts/` |
| Design reference | `specs/003-implement-looptube-ui/design-refs/` |
| UI contracts | `specs/003-implement-looptube-ui/contracts/ui-contracts.md` |
| Data model | `specs/003-implement-looptube-ui/data-model.md` |

## 8. Useful Commands

```bash
npm run build          # production build (check for TS errors + bundle size)
npm run preview        # preview production build locally
npx tsc --noEmit       # type-check only
npm run lint           # ESLint (boundary + style checks)
```
