# Implementation Plan: LoopTube Core — A-B Repeat Playback

**Branch**: `001-looptube-core` | **Date**: 2026-06-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-looptube-core/spec.md`

## Summary

Build LoopTube, a SvelteKit full-stack web service that lets users A-B repeat sections of
YouTube videos for music practice, ear training, and language learning. The core value is a
pure-TypeScript `ABLoopStateMachine` + `SegmentRepository` domain layer that is 100% unit-
testable in Node without a browser, YouTube API, or network. These domain modules are wired
to the YouTube IFrame API, the database, and the browser exclusively via four injected port
interfaces (`VideoPlayerPort`, `StoragePort`, `TimerPort`, `RouterPort`).

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode (`"strict": true` in `tsconfig.json`)

**Phase 1 scope (P1–P3 stories — this plan)**: Core A-B loop, playback controls,
keyboard shortcuts, localStorage segment persistence, share URL. **No authentication
and no server-side DB in Phase 1.**

**Phase 2 scope (P4 — deferred)**: Google OAuth, server-side segment sync, Drizzle ORM,
PostgreSQL, `/api/segments` endpoints, `/auth/` routes. Architecture is designed for
Phase 2 extensibility (ports/adapters pattern), but none of the auth or DB code is
implemented in Phase 1.

**Primary Dependencies (Phase 1)**:
- SvelteKit 2.x (Svelte 5) — full-stack framework
- @inlang/paraglide-sveltekit — compile-time i18n (ja/en)
- @types/youtube — YouTube IFrame API types (devDependency)
- Vitest + @vitest/coverage-v8 — unit/integration test runner
- Playwright + @axe-core/playwright — E2E and accessibility tests
- eslint-plugin-boundaries — architecture boundary enforcement

**Primary Dependencies (Phase 2, not implemented now)**:
- Drizzle ORM + drizzle-kit — TypeScript-native ORM
- @auth/sveltekit (Auth.js v5) — Google OAuth
- better-sqlite3 — SQLite for CI integration tests
- postgres — PostgreSQL driver for production

**Storage (Phase 1)**: `localStorage` only (via `LocalStorageAdapter`)
**Storage (Phase 2)**: PostgreSQL (prod) + SQLite/better-sqlite3 (CI, no Docker)

**Testing**: Vitest (unit + integration, Node environment), Playwright (E2E)

**Target Platform**: Web — Chrome, Firefox, Safari, Edge (latest 2 major versions);
mobile-first responsive

**Project Type**: Full-stack web service (SvelteKit, single deployable unit)

**Performance Goals**:
- New user can set an A-B loop within 60 s of first visit (SC-001)
- Point A/B accuracy ≤ ±0.1 s (SC-002)
- Saved segment loads and activates in ≤ 1 s (SC-003)
- Share URL restores loop in ≤ 3 s after page load (SC-004)

**Constraints**:
- WCAG 2.1 Level AA (FR-019, SC-007)
- i18n: Japanese (ja) and English (en), Paraglide JS
- YouTube IFrame API is the only permitted playback method
- `src/lib/core/` must have zero DOM/Svelte/adapter imports (enforced by ESLint)
- Core loop coverage must reach 100% (ABLoopStateMachine, SegmentRepository, UrlSerializer, KeyboardHandler)

**Scale/Scope**: Phase 1 MVP — no explicit concurrent user target; design for standard
single-instance SvelteKit deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. TDD | Tests written and failing before any implementation code | ✅ Plan enforces test-first task ordering |
| II. Harness Engineering | All 4 fakes defined (FakeVideoPlayer, InMemoryStorageAdapter, FakeTimerAdapter, FakeRouterAdapter) | ✅ Defined in data-model.md |
| III. VideoPlayerPort | YouTubePlayerAdapter isolated in adapters/; no business-logic module imports YT directly | ✅ Architecture enforced by eslint-plugin-boundaries |
| IV. Pure Domain Logic | src/lib/core/ has no DOM, Svelte, or SvelteKit imports | ✅ Zone rule: core → disallow adapters/components/routes |
| V. StoragePort | Phase 1: LocalStorageAdapter implements StoragePort. Phase 2: DatabaseStorageAdapter (owner-scoped) | ✅ Defined in data-model.md |
| VI. Dependency Injection | All 4 ports injected; LoopController wires them outside of core | ✅ Architecture diagram in data-model.md |
| VII. CI Enforcement | Vitest unit → Vitest integration → Playwright E2E (sequential) | ✅ Defined in quickstart.md |
| VIII. Coverage Gate | @vitest/coverage-v8 on src/lib/core/**; threshold 100% branches | ✅ Vitest config will enforce it |
| Tech Stack | SvelteKit, TypeScript strict, Vitest, Playwright, npm/pnpm | ✅ All confirmed in Technical Context |
| Mobile-first | All UI designed and tested at 375 px viewport first | ✅ Enforced via SC-005 |
| i18n-ready | Paraglide JS; all UI strings in locale files | ✅ Enforced via SC-006 / FR-019 |

**Result: All gates pass. No violations.**

## Project Structure

### Documentation (this feature)

```text
specs/001-looptube-core/
├── plan.md              # This file
├── research.md          # Technology decisions (Phase 0)
├── data-model.md        # Entities, port interfaces, state machine (Phase 1)
├── quickstart.md        # Manual validation scenarios (Phase 1)
├── contracts/
│   └── api-segments.md  # REST API contract (Phase 1)
└── tasks.md             # Implementation tasks (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
# Phase 1 only. Phase 2 additions (DB, Auth, API routes) are NOT included here.

src/
├── lib/
│   ├── core/                        # Pure TS — no DOM, no Svelte, no adapters
│   │   ├── ABLoopStateMachine.ts
│   │   ├── SegmentRepository.ts
│   │   ├── UrlSerializer.ts
│   │   └── KeyboardHandler.ts       # Maps {key, shiftKey} → machine commands (no DOM import)
│   ├── ports/                       # Interface definitions (contracts of the domain)
│   │   ├── VideoPlayerPort.ts
│   │   ├── StoragePort.ts
│   │   ├── TimerPort.ts
│   │   └── RouterPort.ts
│   ├── adapters/                    # Phase 1: client-side adapters only
│   │   ├── YouTubePlayerAdapter.ts
│   │   ├── LocalStorageAdapter.ts   # Phase 1 storage (unauthenticated)
│   │   ├── BrowserTimerAdapter.ts
│   │   └── SvelteKitRouterAdapter.ts
│   │   # Phase 2 adds: DatabaseStorageAdapter.ts
│   ├── fakes/                       # Test doubles (published; used in all test layers)
│   │   ├── FakeVideoPlayer.ts
│   │   ├── InMemoryStorageAdapter.ts
│   │   ├── FakeTimerAdapter.ts
│   │   └── FakeRouterAdapter.ts
│   ├── services/                    # Application services (thin; no business logic)
│   │   └── LoopController.ts        # Wires machine + player + timer (no conditionals)
│   ├── components/                  # Svelte UI components
│   │   ├── VideoPlayer.svelte
│   │   ├── ABControls.svelte
│   │   ├── ProgressBar.svelte
│   │   ├── SegmentList.svelte
│   │   └── PlaybackControls.svelte
│   └── i18n/                        # Paraglide locale source files
│       ├── en.json
│       └── ja.json
│       # Phase 2 adds: server/ (Drizzle client, schema)
├── routes/
│   ├── +page.svelte                 # Main player page
│   └── +page.server.ts              # Server-side load (no auth in Phase 1)
│   # Phase 2 adds: api/segments/**, auth/[...auth]/
└── app.d.ts                         # SvelteKit ambient type declarations

tests/
├── unit/                            # Vitest, Node env, no browser
│   ├── ABLoopStateMachine.test.ts
│   ├── SegmentRepository.test.ts
│   ├── UrlSerializer.test.ts
│   └── KeyboardHandler.test.ts
├── integration/                     # Vitest, no browser; Phase 1 = LocalStorageAdapter only
│   └── LocalStorageAdapter.test.ts
│   # Phase 2 adds: segments-api.test.ts, segments-merge.test.ts,
│   #               DatabaseStorageAdapter.test.ts (cross-user 403 test required)
└── e2e/                             # Playwright + @axe-core/playwright
    ├── ab-loop.test.ts
    ├── keyboard-shortcuts.test.ts
    ├── segment-persistence.test.ts
    ├── share-url.test.ts
    ├── accessibility.test.ts        # WCAG 2.1 AA: keyboard/focus/label/contrast via axe
    └── i18n.test.ts                 # Locale switching, no hardcoded UI strings visible
```

**Structure Decision**: Single SvelteKit project (full-stack). The domain layer (`core/`)
is strictly separated from all framework and platform code via `eslint-plugin-boundaries`
zone rules. Fake implementations live in `src/lib/fakes/` and are importable by all test
layers.
