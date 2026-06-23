# Implementation Plan: LoopTube UI — Implement LoopTube.dc.html Design

**Branch**: `003-implement-looptube-ui` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-implement-looptube-ui/spec.md`

## Summary

Deliver a complete, production-ready LoopTube by implementing the dark-theme visual design
from `LoopTube.dc.html` and all new interactive capabilities it introduces: draggable
timeline markers with zoom (Pointer Events API), i18n locale detection via SSR
Accept-Language, 0.25× speed option, inline delete-with-confirmation on saved loops, and
one targeted `ABLoopStateMachine` change to keep A/B points set after finite-loop
completion.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Svelte 5.x (runes), SvelteKit 2.x

**Primary Dependencies**: Svelte 5 runes (`$state`, `$derived`, `$props`), SvelteKit
`load` function (server-side for Accept-Language), Vitest, Playwright, `@vitest/coverage-v8`

**Storage**: `LocalStorageAdapter` (unauthenticated — in scope); server DB (authenticated —
deferred per constitution, not in scope for this feature)

**Testing**: Vitest (Node environment, unit + integration), Playwright (E2E)

**Target Platform**: Evergreen browsers (Chrome, Firefox, Safari latest); no IE/legacy Edge

**Project Type**: Single-route SvelteKit web application (SSR + client hydration)

**Performance Goals**:
- FMP < 2.0 s on 375 px mobile viewport under Lighthouse Fast 4G (SC-002)
- Drag update latency ≤ 16 ms per frame (SC-004)
- Self-hosted font files ≤ 50 KB each after subsetting

**Constraints**:
- No external font CDN; fonts self-hosted from design project `uploads/`
- SSR required (remove `ssr = false` from `+page.ts`) for Accept-Language detection
- 44 × 44 px minimum touch targets (FR-012)
- WCAG 2.1 AA focus indicators (FR-013, SC-006)
- All user-facing strings from locale files; exempt: "LOOPTUBE", "A"/"B", "×", "∞", "MM:SS.s"

**Scale/Scope**: Single route, ~7 components new/modified, ~4 new pure-TS modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TDD | ✅ Pass | All modules follow Red-Green-Refactor; failing tests committed before implementation |
| II. Harness Engineering | ✅ Pass | Drag logic, zoom state, i18n service, locale detector all independently testable in Node |
| III. VideoPlayerPort (NON-NEGOTIABLE) | ✅ Pass | No new YouTube SDK direct references; FakeVideoPlayer used in all tests |
| IV. Pure Domain Logic | ✅ Pass | `ABLoopStateMachine` change is pure TS — no DOM, no Svelte, no SvelteKit |
| V. StoragePort Abstraction | ✅ Pass | `SegmentRepository` + `LocalStorageAdapter` unchanged; `InMemoryStorageAdapter` in tests |
| VI. Dependency Injection (4 ports) | ✅ Pass | Locale string injected as prop/parameter; ZoomState is local component state; no new singletons |
| VII. Test Runner & CI | ✅ Pass | Vitest (unit → integration) → Playwright (E2E) order preserved |
| VIII. Coverage Gate (100%) | ✅ Pass | `ABLoopStateMachine` and `SegmentRepository` maintain 100% coverage after the targeted change |
| TypeScript strict | ✅ Pass | No `any` in new code; all props typed |
| Lint + import boundaries | ✅ Pass | No domain module imports from Svelte/SvelteKit/DOM |

**Complexity Tracking**: No constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-implement-looptube-ui/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── design-refs/         # FR-016 gate: LoopTube.dc.html + screenshots (must exist before impl)
├── contracts/
│   └── ui-contracts.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code

```text
src/
├── routes/
│   ├── +page.ts           # MODIFY: remove ssr=false (file becomes empty — delete)
│   ├── +page.server.ts    # NEW: server-only load — reads Accept-Language → returns locale
│   └── +page.svelte       # MODIFY: wire locale, zoom state, new components
├── lib/
│   ├── core/
│   │   └── ABLoopStateMachine.ts     # MODIFY: 1 targeted change — finite-loop completion keeps LOOPING state
│   ├── i18n/
│   │   ├── en.json                   # MODIFY: add new keys (segment→loop rename in values, new features)
│   │   ├── ja.json                   # MODIFY: same — all keys in Japanese
│   │   └── index.ts                  # NEW: Locale type, LocaleStrings type, t() accessor
│   ├── components/
│   │   ├── LoopTubeHeader.svelte     # NEW: LOOPTUBE logotype in Barlow
│   │   ├── Timeline.svelte           # NEW: replaces ProgressBar — draggable A/B markers + zoom
│   │   ├── ABControls.svelte         # MODIFY: hidden nudge/clear when point not set; i18n strings
│   │   ├── PlaybackControls.svelte   # MODIFY: add 0.25× speed; N/M counter; i18n
│   │   └── LoopList.svelte           # NEW: replaces SegmentList — inline delete-confirm; i18n
│   └── adapters/
│       └── LocalStorageAdapter.ts    # unchanged

tests/
├── unit/
│   ├── ABLoopStateMachine.test.ts    # UPDATE: add finite-loop completion scenarios
│   ├── Timeline.drag.test.ts         # NEW: drag logic, clamp, min-gap
│   ├── ZoomState.test.ts             # NEW: zoom window calculation
│   ├── i18n.test.ts                  # NEW: locale selection, fallback, t() accessor
│   └── locale-detector.test.ts       # NEW: Accept-Language parsing, fallback to en
└── e2e/
    └── looptube.spec.ts              # UPDATE: drag, zoom, locale, inline delete-confirm

static/
└── fonts/
    ├── barlow/                       # Self-hosted, subsetted Barlow (≤50 KB each)
    ├── noto-sans-jp/                 # Self-hosted, subsetted Noto Sans JP (≤50 KB each)
    └── roboto-mono/                  # Self-hosted, subsetted Roboto Mono (≤50 KB each)
```

**Structure Decision**: Single SvelteKit project (no backend split). All new logic is
additive. The i18n module (`src/lib/i18n/`) is a new pure-TS directory; the font assets
go to `static/fonts/` following SvelteKit's static asset convention.
