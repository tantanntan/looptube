---

description: "Task list for LoopTube Core — A-B Repeat Playback (Phase 1: P1–P3 stories)"
---

# Tasks: LoopTube Core — A-B Repeat Playback

**Input**: Design documents from `specs/001-looptube-core/`

**Prerequisites**: plan.md ✅ spec.md ✅ data-model.md ✅ research.md ✅ contracts/ ✅

**Scope**: Phase 1 only (US1–US5). US6 (Google OAuth + server-side sync) is Phase 2 — not included.

**TDD enforced** (constitution Principle I): Unit tests, adapter tests, and component tests
appear **before** their implementation tasks within every phase. E2E tests are written
before the wiring tasks that would make them pass.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in all descriptions

## Path Conventions

- Domain core: `src/lib/core/`
- Port interfaces: `src/lib/ports/`
- Adapters: `src/lib/adapters/`
- Test doubles: `src/lib/fakes/`
- Services: `src/lib/services/`
- Svelte components: `src/lib/components/`
- Routes: `src/routes/`
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`

---

## Phase 1: Setup

**Purpose**: Project initialization, tooling, and directory skeleton.

- [x] T001 Initialize SvelteKit 2.x project with TypeScript strict mode (`"strict": true` in `tsconfig.json`); confirm `pnpm dev` starts
- [x] T002 Configure Vitest with `@vitest/coverage-v8`; add `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:unit --coverage` scripts in `package.json`; configure integration test suite to run in Node environment without browser
- [x] T003 [P] Configure Playwright; add `pnpm test:e2e` script in `package.json`
- [x] T004 [P] Configure `eslint-plugin-boundaries` with zone rules (`core` → disallow `adapters`, `components`, `routes`) in `eslint.config.js`
- [x] T005 [P] Add ESLint override for `src/lib/core/**`: ban browser globals (`window`, `document`, `localStorage`, `globalThis`) via `no-restricted-globals`; ban `$app/*` and `svelte/*` via `no-restricted-imports` in `eslint.config.js`
- [x] T006 [P] Install and configure `@inlang/paraglide-sveltekit`; create empty locale files `src/lib/i18n/en.json` and `src/lib/i18n/ja.json`
- [x] T007 [P] Install `@testing-library/svelte` and `@testing-library/jest-dom`; add `.svelte` transform to Vitest config for component tests in `vitest.config.ts`
- [x] T008 Create full directory skeleton: `src/lib/core/`, `src/lib/ports/`, `src/lib/adapters/`, `src/lib/fakes/`, `src/lib/services/`, `src/lib/components/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`

**Checkpoint**: `pnpm dev` starts; `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e` all run (zero tests, zero failures); ESLint passes.

---

## Phase 2: Foundational — Port Interfaces & Fakes

**Purpose**: Define the four port contracts, `StorageLike`, and all fake implementations.
**⚠️ CRITICAL**: All user story work depends on these fakes being usable in tests.

- [x] T009 Define `VideoPlayerPort`, `VideoLoadError`, `PlayerState` types in `src/lib/ports/VideoPlayerPort.ts`
- [x] T010 [P] Define `StorageLike`, `StoragePort`, `Segment`, `SegmentInput`, `MergeResult` types in `src/lib/ports/StoragePort.ts`
- [x] T011 [P] Define `TimerPort`, `TimerHandle` types (`setInterval`, `clearInterval`, `setTimeout`, `clearTimeout`) in `src/lib/ports/TimerPort.ts`
- [x] T012 [P] Define `RouterPort` interface in `src/lib/ports/RouterPort.ts`
- [x] T013 [P] Implement `FakeVideoPlayer` (controllable state, `loadVideo` returns `{ok:true}`, `onError` registerable, `tick`able time) in `src/lib/fakes/FakeVideoPlayer.ts`
- [x] T014 [P] Implement `InMemoryStorageAdapter` (`StorageLike`-backed, upsert by `(videoId, name)`, returns `MergeResult`) in `src/lib/fakes/InMemoryStorageAdapter.ts`
- [x] T015 [P] Implement `FakeTimerAdapter` (manually-advanceable clock with `tick(ms)` helper) in `src/lib/fakes/FakeTimerAdapter.ts`
- [x] T016 [P] Implement `FakeRouterAdapter` (in-memory param map) in `src/lib/fakes/FakeRouterAdapter.ts`

**Checkpoint**: All four ports defined; all four fakes pass TypeScript compilation and ESLint (including core boundary rules).

---

## Phase 3: User Story 1 — Load Video & Set A-B Loop (Priority: P1) 🎯 MVP

**Goal**: User pastes a YouTube URL → video loads → presses A then B → loop plays continuously.

**Independent Test**: Load any public YouTube video, set A/B, confirm the player loops within the segment indefinitely.

### Tests for User Story 1 ⚠️ Write FIRST — ensure they FAIL before implementing

- [x] T017 [US1] Write failing unit tests for `ABLoopStateMachine`: all state transitions (`IDLE→HAS_A→LOOPING`), `tick()` returning `SEEK`/`NONE`, `clearAll()`, `lastSetPoint` tracking, `B_BEFORE_A` guard in `tests/unit/ABLoopStateMachine.test.ts`
- [x] T018 [P] [US1] Write failing unit tests for `UrlSerializer`: `parse()` valid URL, malformed input, unknown speed defaulting with `warnings`, `encode()` round-trip in `tests/unit/UrlSerializer.test.ts`
- [x] T019 [P] [US1] Write failing unit tests for `YouTubePlayerAdapter`: verify error code 100 maps to `NOT_FOUND`, 101/150 to `NOT_EMBEDDABLE`, `onYouTubeIframeAPIReady` gates instantiation (inject mock `YT` via constructor) in `tests/unit/YouTubePlayerAdapter.test.ts`
- [x] T020 [P] [US1] Write failing component tests for `VideoPlayer.svelte`: renders player element, shows error message on `NOT_FOUND`, shows error message on `NOT_EMBEDDABLE` (use `@testing-library/svelte` + `FakeVideoPlayer`) in `tests/unit/VideoPlayer.test.ts`
- [x] T021 [P] [US1] Write failing component tests for `ABControls.svelte`: A button emits event, B button emits event, fine-tune ±0.1 buttons emit nudge events, displays current pointA/pointB values in `tests/unit/ABControls.test.ts`
- [x] T022 [P] [US1] Write failing E2E test for full A-B loop flow (load video URL, confirm player appears, set A/B, confirm loop replays) in `tests/e2e/ab-loop.test.ts` — will fail until Phase 3 wiring completes

### Implementation for User Story 1

- [x] T023 [US1] Implement `ABLoopStateMachine` in `src/lib/core/ABLoopStateMachine.ts` — make T017 pass
- [x] T024 [P] [US1] Implement `UrlSerializer.parse()` and `encode()` (Stage 1; `clampToDuration()` added in US5) in `src/lib/core/UrlSerializer.ts` — make T018 pass
- [x] T025 [US1] Implement `YouTubePlayerAdapter` (gates on `onYouTubeIframeAPIReady`, maps error codes, accepts injectable `YT` factory for tests) in `src/lib/adapters/YouTubePlayerAdapter.ts` — make T019 pass
- [x] T026 [P] [US1] Implement `BrowserTimerAdapter` (wraps `window.setInterval/clearInterval/setTimeout/clearTimeout`) in `src/lib/adapters/BrowserTimerAdapter.ts`
- [x] T027 [P] [US1] Implement `SvelteKitRouterAdapter` (wraps `page` store and `goto`) in `src/lib/adapters/SvelteKitRouterAdapter.ts`
- [x] T028 [US1] Implement `LoopController` (thin orchestrator: timer interval → `machine.tick(player.getCurrentTime())` → dispatch `TickAction`; zero conditional logic) in `src/lib/services/LoopController.ts`
- [x] T029 [US1] Implement `VideoPlayer.svelte` (embeds YouTube IFrame, initialises adapter, shows typed error message) in `src/lib/components/VideoPlayer.svelte` — make T020 pass
- [x] T030 [US1] Implement `ABControls.svelte` (A/B buttons, ±0.1 fine-tune per point, point labels, clear buttons) in `src/lib/components/ABControls.svelte` — make T021 pass
- [x] T031 [P] [US1] Implement `ProgressBar.svelte` (position + A/B markers, updates every 100 ms) in `src/lib/components/ProgressBar.svelte`
- [x] T032 [US1] Wire `+page.svelte` (URL input → video ID normalisation → VideoPlayer, ABControls, ProgressBar; video ID reflected in URL via RouterPort) in `src/routes/+page.svelte` — makes T022 pass
- [x] T033 [P] [US1] Add i18n keys (`error.not_found`, `error.not_embeddable`, `error.invalid_url`) to `src/lib/i18n/en.json` and `src/lib/i18n/ja.json`

**Checkpoint**: US1 fully functional and independently testable. E2E test T022 passes.

---

## Phase 4: User Story 2 — Playback Controls & Speed (Priority: P2)

**Goal**: Speed selector (0.5×–2.0×) and finite loop count; player stops after N repetitions.

**Independent Test**: Set speed to 0.5×, confirm slow playback. Set count to 3, confirm stop after 3.

> ⚠️ **Dependency note**: T035–T036 (pure module + component) can start in **parallel with
> US1**, but T037 (wiring to `+page.svelte`) MUST wait for US1 completion (T032).

### Tests for User Story 2 ⚠️ Write FIRST

- [x] T034 [US2] Extend `ABLoopStateMachine` tests: `setLoopCount(n)`, `loopsCompleted` increments on each tick at pointB, `STOP_AND_SEEK` returned on final repetition, infinite count never returns `STOP_AND_SEEK` in `tests/unit/ABLoopStateMachine.test.ts`
- [x] T035 [P] [US2] Write failing component tests for `PlaybackControls.svelte`: speed selector renders 6 options, selecting emits `speedChange` event; loop count input accepts 1–99 and 'infinite', emits `loopCountChange` in `tests/unit/PlaybackControls.test.ts`

### Implementation for User Story 2

- [x] T036 [US2] Extend `ABLoopStateMachine.setLoopCount(n: number | 'infinite')`, `loopsCompleted` tracking, `STOP_AND_SEEK` on final loop in `src/lib/core/ABLoopStateMachine.ts` — make T034 pass
- [x] T037 [P] [US2] Implement `PlaybackControls.svelte` in `src/lib/components/PlaybackControls.svelte` — make T035 pass
- [x] T038 [US2] Wire `PlaybackControls.svelte` into `+page.svelte`; connect speed to `player.setPlaybackRate()` and loop count to `machine.setLoopCount()` in `src/routes/+page.svelte` — **requires US1 T032 complete**

**Checkpoint**: Speed and loop count work independently of segment persistence.

---

## Phase 5: User Story 3 — Keyboard Shortcuts (Priority: P2)

**Goal**: A/B/Space/arrows/Shift+arrows/Escape work without touching the mouse.

**Independent Test**: Tab to player, use keyboard only to set A/B and clear the loop.

> ⚠️ **Dependency note**: T040 (KeyboardHandler pure module) can start in **parallel with
> US1**, but T041 (wiring to `+page.svelte`) MUST wait for US1 completion (T032).

### Tests for User Story 3 ⚠️ Write FIRST

- [x] T039 [US3] Write failing unit tests for `KeyboardHandler`: maps `{key, shiftKey}` → command enum (setA, setB, playPause, seekBack, seekForward, nudgeLastSetBack, nudgeLastSetForward, clearLoop); no DOM import allowed in `tests/unit/KeyboardHandler.test.ts`
- [x] T039b [P] [US3] Write failing E2E test for all keyboard shortcuts (Space, A, B, ←/→, Shift+←/Shift+→, Escape) in `tests/e2e/keyboard-shortcuts.test.ts` — fails until T041 wiring completes

### Implementation for User Story 3

- [x] T040 [US3] Implement `KeyboardHandler` (pure TS, input: `{key: string, shiftKey: boolean}`, output: command enum; zero `KeyboardEvent` import) in `src/lib/core/KeyboardHandler.ts` — make T039 pass
- [x] T041 [US3] Wire keyboard handler to `+page.svelte` (attach `keydown` on `document`, extract `{key, shiftKey}`, dispatch command to machine/player) in `src/routes/+page.svelte` — makes T039b pass; **requires US1 T032 complete**

**Checkpoint**: All 8 keyboard shortcuts functional. T039b E2E test passes.

---

## Phase 6: User Story 4 — Save, List & Load Segments (Priority: P3)

**Goal**: Unauthenticated users save named A-B segments to localStorage, reload and restore them.

**Independent Test**: Save → reload page with same video URL → segment loads from localStorage → Load activates loop.

> ⚠️ **Dependency note**: T042–T047 (pure modules + component) can start in **parallel with
> US1**, but T048 (wiring to `+page.svelte`) MUST wait for US1 completion (T032).

### Tests for User Story 4 ⚠️ Write FIRST

- [x] T042 [US4] Write failing unit tests for `SegmentRepository`: `save()` validates `pointA < pointB`, valid `speed`; upsert by `(videoId, name)`; `delete()` delegates; `listByVideoId()` delegates; `mergeAll()` returns `MergeResult` in `tests/unit/SegmentRepository.test.ts`
- [x] T043 [P] [US4] Write failing integration tests for `LocalStorageAdapter` using injected `MapBackedStorage` (no `window`): list, upsert (create + overwrite), delete, `(videoId, name)` uniqueness, key format `looptube:segments:{videoId}`, `mergeAll()` counts in `tests/integration/LocalStorageAdapter.test.ts`
- [x] T044 [P] [US4] Write failing component tests for `SegmentList.svelte`: renders segment list, Load button emits `load` event with segment data, Delete button emits `delete` event, empty-state message when list is empty in `tests/unit/SegmentList.test.ts`
- [x] T044b [P] [US4] Write failing E2E test for segment persistence (save segment, reload page with same video ID, confirm segment in list, click Load, confirm loop activates) in `tests/e2e/segment-persistence.test.ts`

### Implementation for User Story 4

- [x] T045 [US4] Implement `SegmentRepository` (validates domain invariants, delegates to `StoragePort`) in `src/lib/core/SegmentRepository.ts` — make T042 pass
- [x] T046 [US4] Implement `LocalStorageAdapter` with `StorageLike` constructor injection (`new LocalStorageAdapter(storage: StorageLike = window.localStorage)`; upsert by `(videoId, name)`) in `src/lib/adapters/LocalStorageAdapter.ts` — make T043 pass
- [x] T047 [US4] Implement `SegmentList.svelte` (list, Load, Delete, empty state) in `src/lib/components/SegmentList.svelte` — make T044 pass
- [x] T048 [US4] Add segment save UI (name input + Save button) and wire `SegmentRepository` + `LocalStorageAdapter` + `SegmentList` into `+page.svelte` in `src/routes/+page.svelte` — makes T044b pass; **requires US1 T032 complete**
- [x] T049 [P] [US4] Add i18n keys (`segment.save`, `segment.load`, `segment.delete`, `segment.name_placeholder`, `segment.empty`) to `src/lib/i18n/en.json` and `src/lib/i18n/ja.json`

**Checkpoint**: US4 fully functional. T044b E2E test passes.

---

## Phase 7: User Story 5 — Share Loop via URL (Priority: P3)

**Goal**: Share button generates a URL; opening it auto-restores the loop.

**Independent Test**: Generate share URL → open in fresh browser tab → loop auto-loads within 3 s.

### Tests for User Story 5 ⚠️ Write FIRST

- [x] T050 [US5] Extend `UrlSerializer` tests: `encode()` produces correct URL params; `clampToDuration()` clamps values above duration, sets `clamped: true`, provides i18n message key; `parse()` `warnings` field when values may exceed duration in `tests/unit/UrlSerializer.test.ts`
- [x] T051 [P] [US5] Write failing E2E test for share URL round-trip (set loop, click Share, open generated URL in new browser context, confirm video + A + B + speed restored, loop active) in `tests/e2e/share-url.test.ts`

### Implementation for User Story 5

- [x] T052 [US5] Implement `UrlSerializer.encode()` and `UrlSerializer.clampToDuration()` in `src/lib/core/UrlSerializer.ts` — make T050 pass
- [x] T053 [US5] Add Share button to `+page.svelte` (encode → copy to clipboard → toast) and auto-load from URL params on init (parse → restore after `onReady`, clamp if needed, show warning) in `src/routes/+page.svelte` — makes T051 pass
- [x] T054 [P] [US5] Add i18n keys (`share.button`, `share.copied`, `share.loop_clamped`) to `src/lib/i18n/en.json` and `src/lib/i18n/ja.json`

**Checkpoint**: Share URL round-trip works. T051 E2E test passes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: WCAG, i18n completeness, coverage gate enforcement, CI pipeline, responsive polish.

- [x] T055 [P] Write E2E accessibility test (axe-core zero violations, keyboard navigation, visible focus rings, all inputs labelled) using `@axe-core/playwright` on main player page in `tests/e2e/accessibility.test.ts`
- [x] T056 [P] Write E2E i18n test (switch locale en↔ja, confirm all visible strings change, no hardcoded English visible in Japanese locale) in `tests/e2e/i18n.test.ts`
- [x] T057 Configure Vitest coverage threshold: 100% branch coverage enforced for `src/lib/core/**` (`ABLoopStateMachine`, `SegmentRepository`, `UrlSerializer`, `KeyboardHandler`) in `vitest.config.ts`; confirm `pnpm test:unit --coverage` fails if threshold not met
- [x] T058 Configure CI pipeline (sequential: `pnpm test:unit` → `pnpm test:integration` → `pnpm test:e2e`; coverage gate on unit stage; block on any failure) in `.github/workflows/ci.yml`
- [ ] T059 [P] Responsive design review: verify all components at 375 px viewport (no horizontal scroll, tap targets ≥ 44 px); fix any regressions in `src/lib/components/`
- [x] T060 [P] Complete `ja.json` translations: all i18n keys present; mark any unreviewed as `TODO:` in `src/lib/i18n/ja.json`
- [ ] T061 [P] WCAG fixes driven by T055 results: keyboard navigation, focus indicators, colour contrast ≥ 4.5:1, programmatic labels in `src/lib/components/`

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends on | Notes |
|---|---|---|
| Setup (Phase 1) | — | Start immediately |
| Foundational (Phase 2) | Phase 1 complete | **BLOCKS all stories** |
| US1 (Phase 3) | Phase 2 complete | Full story: tests + impl + wiring |
| US2 (Phase 4) — pure modules | Phase 2 complete | T034–T037 parallelisable with US1 |
| US2 (Phase 4) — wiring | **US1 T032** | T038 needs `+page.svelte` |
| US3 (Phase 5) — pure module | Phase 2 complete | T039–T040 parallelisable with US1 |
| US3 (Phase 5) — wiring | **US1 T032** | T041 needs `+page.svelte` |
| US4 (Phase 6) — pure modules | Phase 2 complete | T042–T047 parallelisable with US1 |
| US4 (Phase 6) — wiring | **US1 T032** | T048 needs `+page.svelte` + loop state |
| US5 (Phase 7) | **US1 T024** (UrlSerializer base) | T053 wiring also needs US1 T032 |
| Polish (Phase 8) | All user stories | Cross-cutting concerns |

### Parallel Strategy — "Pure modules first, wiring after US1"

While Developer A builds US1:
- Developer B: T034 + T036 (ABLoopStateMachine extension + PlaybackControls.svelte) — pure, no page dependency
- Developer C: T039 + T040 (KeyboardHandler tests + impl) — pure, no page dependency
- Developer D: T042–T047 (SegmentRepository + LocalStorageAdapter + SegmentList tests + impl) — pure, no page dependency

After US1 T032 (`+page.svelte`) is complete:
- All wiring tasks (T038, T041, T048) can run in parallel on separate branches

---

## Implementation Strategy

### MVP First (P1 — US1 only, T001–T033)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational — CRITICAL)
3. Complete Phase 3 (US1 full: tests + impl + wiring)
4. **STOP and VALIDATE**: `pnpm test:unit --coverage` passes 100%; E2E T022 passes
5. Loop plays; error messages work; video ID in URL

### Incremental Delivery (P1 → P3)

1. Foundation + US1 → **Loop works** (MVP)
2. US2 + US3 in parallel (pure modules overlap with US1; wiring after) → **Full controls + keyboard**
3. US4 → **Segment persistence**
4. US5 → **Shareable loops**
5. Polish → **Production-ready**

---

## Notes

- `[P]` tasks = different files, no incomplete dependencies — safe to run in parallel
- Every unit/integration test task appears **before** its implementation task (TDD)
- E2E tests for each story are written **before** the wiring tasks that make them pass
- `LoopController` is excluded from the 100% coverage gate (thin orchestrator, no logic)
- `LocalStorageAdapter` accepts `StorageLike` injection — integration tests use `MapBackedStorage`, not `window.localStorage`
- US6 (Google OAuth + DB sync) is Phase 2 — not in this task list
- Commit after each Checkpoint to preserve independently testable increments
