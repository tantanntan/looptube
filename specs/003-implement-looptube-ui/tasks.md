# Tasks: LoopTube UI — 003-implement-looptube-ui

**Input**: Design documents from `specs/003-implement-looptube-ui/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-contracts.md ✅, quickstart.md ✅

**TDD Mandate** (from constitution): All test tasks in each phase MUST be committed and confirmed failing BEFORE the corresponding implementation tasks are started.

**Organization**: Grouped by user story (US1–US6) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US6)
- File paths are from repo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Readiness gates and one-time tooling setup. All must complete before any coding begins.

> ⚠️ **FR-016 Gate** — T001 is a user/manual action. No implementation work may start until `specs/003-implement-looptube-ui/design-refs/LoopTube.dc.html` exists in the repo.

- [ ] T001 Export `LoopTube.dc.html` and reference screenshots from claude.ai design project `22934576-e45f-4f40-ad9a-5a47dbc2260a` and commit to `specs/003-implement-looptube-ui/design-refs/` (FR-016 gate — manual user action)
- [ ] T002 Create `scripts/subset-fonts.sh` — shell script that runs `pyftsubset` on the three typefaces and outputs `.woff2` files to `static/fonts/` with the Unicode ranges defined in `research.md` section 6
- [ ] T003 [P] Create directory skeleton `static/fonts/barlow/`, `static/fonts/noto-sans-jp/`, `static/fonts/roboto-mono/` with `.gitkeep` placeholders (replaced by T013)

**Checkpoint**: Design reference committed; font tooling ready — coding can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared modules that ALL user stories depend on. Must be complete before any story phase begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundational Modules

> **Write these tests FIRST and confirm they FAIL before T007–T011**

- [ ] T004 [P] Write failing unit tests for `parseLocale` and `createTranslator` (key lookup, missing key fallback, nested key notation) in `tests/unit/i18n.test.ts`
- [ ] T005 [P] Write failing unit tests for `parseLocale` edge cases — RFC 5646 multi-tag headers, `ja-JP` → `'ja'`, unknown → `'en'` fallback — in `tests/unit/locale-detector.test.ts`
- [ ] T006 [P] Write failing unit test for `ABLoopStateMachine.tick()` finite-loop completion: after N-th repetition, state stays `LOOPING` with `loopCount: 'infinite'` and A/B preserved; action is `STOP_AND_SEEK` to `pointB` (stops at Point B per spec US4 scenario 2) — in `tests/unit/ABLoopStateMachine.test.ts`

### Implementation for Foundational Modules

- [ ] T007 Implement `src/lib/i18n/index.ts` — export `Locale` type, `createTranslator(locale: Locale): (key: string) => string`, `parseLocale(header: string): Locale` (satisfies T004, T005)
- [ ] T008 [P] Update `src/lib/i18n/en.json` — add `loops.section_heading`, `loops.save_placeholder`, `loops.save_button`, `loops.delete_confirm`, `loops.confirm_yes`, `loops.confirm_no`, `loops.empty`, `loops.delete`; `playback.counter`; `timeline.zoom_in`, `timeline.zoom_out`
- [ ] T009 [P] Update `src/lib/i18n/ja.json` — add identical key set as T008 with Japanese translations
- [ ] T010 Apply targeted change to `src/lib/core/ABLoopStateMachine.ts` — final-repetition branch in `tick()`: replace `this.state = { status: 'IDLE' }` with `this.state = { ...s, loopsCompleted: nextCompleted, loopCount: 'infinite' }`; replace `to: s.pointA` with `to: s.pointB` in the `STOP_AND_SEEK` return (satisfies T006)
- [ ] T011 Remove `export const ssr = false;` from `src/routes/+page.ts` (file becomes empty — delete it); create `src/routes/+page.server.ts` — add `import type { PageServerLoad } from './$types'; import { parseLocale } from '$lib/i18n/index.js'; export const load: PageServerLoad = ({ request }) => { const locale = parseLocale(request.headers.get('accept-language') ?? ''); return { locale }; }` (Note: `request` is only available in server load — `+page.server.ts` not `+page.ts`)

**Checkpoint**: i18n module functional, ABLoopStateMachine change merged and covered, SSR enabled — all story phases may begin.

---

## Phase 3: User Story 1 — Dark-Theme UI on Mobile (Priority: P1) 🎯 MVP

**Goal**: Deliver a polished, dark-theme mobile-first UI matching `LoopTube.dc.html`, including the LOOPTUBE logotype, correct typography, and accessible touch targets.

**Independent Test**: Open the app on a 375 px viewport and confirm the layout matches the `LoopTube.dc.html` reference without overflow, and the LOOPTUBE logotype is visible in Barlow.

### Tests for User Story 1

> **Write and confirm FAILING before T013–T018**

- [ ] T012 [P] [US1] Write failing E2E scenarios for dark-theme mobile layout in `tests/e2e/looptube.spec.ts` — 375px viewport: no horizontal overflow, LOOPTUBE logotype present, all controls within viewport

### Implementation for User Story 1

- [ ] T013 [P] [US1] Run `scripts/subset-fonts.sh` to produce `.woff2` files; commit `static/fonts/barlow/barlow-semibold.woff2`, `static/fonts/noto-sans-jp/noto-sans-jp-regular.woff2`, `static/fonts/roboto-mono/roboto-mono-regular.woff2` (max 50 KB each per SC-002)
- [ ] T014 [P] [US1] Create `src/lib/components/LoopTubeHeader.svelte` — renders LOOPTUBE logotype using Barlow font; no props required per `ui-contracts.md` `LoopTubeHeaderProps`
- [ ] T015 [US1] Create `src/app.css` if not present and add `import '../app.css';` to `src/routes/+layout.svelte`; then add `@font-face` declarations for all three fonts with `font-display: swap` and correct `src: url('/fonts/…') format('woff2')` paths (depends on T013)
- [ ] T016 [US1] Apply dark-theme global CSS to `src/app.css` — background colour, text colour, spacing tokens, and typography scale from `specs/003-implement-looptube-ui/design-refs/LoopTube.dc.html` (depends on T001)
- [ ] T017 [US1] Apply mobile-first responsive layout to `src/routes/+page.svelte` — 375 px base, centered `max-width` container for desktop, add `<LoopTubeHeader>` at top (depends on T014, T015, T016)
- [ ] T018 [US1] Audit and fix 44 × 44 px touch targets and WCAG 2.1 AA focus indicators in `src/lib/components/ABControls.svelte`, `src/lib/components/PlaybackControls.svelte`, and any other interactive components

**Checkpoint**: US1 visually verifiable on a 375 px device with Barlow logotype; all touch targets ≥ 44 × 44 px.

---

## Phase 4: User Story 2 — Visual Scrub Timeline with Zoom (Priority: P1)

**Goal**: Deliver a draggable A/B marker timeline with single-toggle auto-fit zoom, replacing the existing `ProgressBar` component.

**Independent Test**: Load any video, set A-B loop, activate zoom — A/B markers become visually separated and individually draggable; tapping zoom again returns to full-video view.

### Tests for User Story 2

> **Write and confirm FAILING before T022–T025**

- [ ] T019 [P] [US2] Write failing unit tests for pure timeline helpers in `tests/unit/Timeline.drag.test.ts` — `clampPointA`, `clampPointB` (min-gap 0.1 s), `pxToSeconds` (full-video and zoom-window modes), `secondsToPercent`
- [ ] T020 [P] [US2] Write failing unit tests for `computeZoomWindow` edge cases in `tests/unit/ZoomState.test.ts` — very short loop (< 1 s), loop at start (`pointA = 0`), loop at end (`pointB = duration`)
- [ ] T021 [P] [US2] Write failing E2E scenarios for drag and zoom in `tests/e2e/looptube.spec.ts` — drag A/B in full-video and zoom mode, zoom button hidden when no A-B loop, marker clamping

### Implementation for User Story 2

- [ ] T022 [US2] Create `src/lib/utils/timeline.ts` — export pure helpers: `formatTime`, `computeZoomWindow`, `pxToSeconds`, `secondsToPercent`, `clampPointA`, `clampPointB` (satisfies T019, T020; no DOM/Svelte imports)
- [ ] T023 [US2] Create `src/lib/components/Timeline.svelte` — Pointer Events API drag (`pointerdown`, `pointermove`, `pointerup`, `setPointerCapture`), moving playhead, A-B highlighted region, per `TimelineProps` in `ui-contracts.md` (depends on T022)
- [ ] T024 [US2] Add zoom state to `src/routes/+page.svelte` — `zoomActive: boolean` (`$state`), `onZoomToggle` handler calling `computeZoomWindow`; zoom button rendered in `Timeline.svelte` only when `pointA !== null && pointB !== null` per `TimelineProps` contract (depends on T022, T023)
- [ ] T025 [US2] Replace `<ProgressBar>` with `<Timeline>` in `src/routes/+page.svelte` — wire `currentTime`, `duration`, `pointA`, `pointB`, `zoomActive`, `onDragA`, `onDragB`, `onZoomToggle`, `onSeek`, `t` per page orchestrator section of `ui-contracts.md` (depends on T023, T024)

**Checkpoint**: US2 independently testable — drag and zoom work on device; unit tests green; E2E drag scenarios pass.

---

## Phase 5: User Story 3 — Redesigned A/B Controls Panel (Priority: P2)

**Goal**: Update `ABControls.svelte` to hide nudge/clear buttons when the corresponding point is not set, display timestamps in `MM:SS.s` format, and accept the `t` prop for i18n strings.

**Independent Test**: Load a video, set only Point A — nudge and clear for Point B are hidden; only Point A controls are visible with a correct `MM:SS.s` timestamp.

### Tests for User Story 3

> **Write and confirm FAILING before T026–T027**

- [ ] T026a [P] [US3] Write failing unit tests for `ABControls.svelte` — `formatTime` display, conditional nudge/clear button rendering when point is `null` — in `tests/unit/ABControls.test.ts`

### Implementation for User Story 3

- [ ] T026 [US3] Update `src/lib/components/ABControls.svelte` — add `t: (key: string) => string` prop; hide nudge (−0.1 s / +0.1 s) and clear buttons when the corresponding point is `null`; display timestamps via `formatTime` from `src/lib/utils/timeline.ts`; per `ABControlsProps` in `ui-contracts.md`
- [ ] T027 [US3] Wire `t` prop to `<ABControls>` in `src/routes/+page.svelte`

**Checkpoint**: US3 independently testable — nudge/clear buttons hidden when point not set; timestamps in `MM:SS.s`.

---

## Phase 6: User Story 4 — Speed and Loop-Count Controls (Priority: P2)

**Goal**: Add 0.25× speed option, display the N/M finite-loop counter, and preserve A/B markers after finite-loop completion (via the ABLoopStateMachine change from Phase 2).

**Independent Test**: Set speed to 0.25×, set loop count to 5, confirm 5 complete loops at 0.25× speed — counter shows "1 / 5" through "5 / 5", then resets to "∞"; A/B markers remain set.

### Tests for User Story 4

> **Write and confirm FAILING before T028–T030**

- [ ] T027a [P] [US4] Write failing unit tests for `PlaybackControls.svelte` — 0.25× speed option present in rendered output, N/M counter display when `loopCount` is a number, "∞" display when `loopCount === 'infinite'` — in `tests/unit/PlaybackControls.test.ts`

### Implementation for User Story 4

- [ ] T028 [US4] Update `src/lib/components/PlaybackControls.svelte` — add `0.25` to speed options array `[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]`; add `loopsCompleted: number` and `t: (key: string) => string` props per `PlaybackControlsProps` in `ui-contracts.md`
- [ ] T029 [US4] Implement N/M counter display in `PlaybackControls.svelte` — when `loopCount` is a number: show `"${loopsCompleted} / ${loopCount}"`; when `loopCount === 'infinite'`: show `"∞"` (FR-003 exempt)
- [ ] T030 [US4] Wire `loopsCompleted` and `t` to `<PlaybackControls>` in `src/routes/+page.svelte` — derive `loopsCompleted` as `machineState.status === 'LOOPING' ? machineState.loopsCompleted : 0`

**Checkpoint**: US4 independently testable — 0.25× speed available; N/M counter shows during finite looping; ∞ resets on completion; A/B preserved after finite completion (validated by T006 unit test from Phase 2).

---

## Phase 7: User Story 5 — Saved Loops Section (Priority: P2)

**Goal**: Deliver `LoopList.svelte` replacing `SegmentList.svelte` — with inline delete-with-confirmation, always-visible section heading, and empty-state placeholder.

**Independent Test**: Save a loop, reload with the same video ID — loop appears; tap trash icon — inline "Delete? [Yes] [No]" replaces the icon; tap Yes — loop removed; tap No — row reverts.

### Tests for User Story 5

> **Write and confirm FAILING before T032–T034**

- [ ] T031 [P] [US5] Write failing E2E scenarios for inline delete confirmation in `tests/e2e/looptube.spec.ts` — trash tap shows Yes/No inline; Yes removes; No reverts; at most one row in confirm mode

### Implementation for User Story 5

- [ ] T032 [US5] Create `src/lib/components/LoopList.svelte` — replaces `SegmentList.svelte`; renders "Saved Loops" section heading (always visible); empty-state placeholder when `loops.length === 0`; per `LoopListProps` in `ui-contracts.md`
- [ ] T033 [US5] Implement inline delete-with-confirmation in `LoopList.svelte` — `deleteConfirmId: string | null` as `$state`; trash icon tap sets `deleteConfirmId = id`; row expands to show `t('loops.delete_confirm')` + Yes/No buttons; Yes calls `onDelete`, No resets; `$effect` resets on `loops` prop change
- [ ] T034 [US5] Wire `<LoopList>` in `src/routes/+page.svelte` — replace `<SegmentList>` import and usage; pass `loops`, `t`, `onLoad`, `onDelete`

**Checkpoint**: US5 independently testable — saved loops load on page reload; inline delete flow complete; section heading always visible; empty state shown for no loops.

---

## Phase 8: User Story 6 — i18n: Japanese and English Localisation (Priority: P3)

**Goal**: Complete the locale wiring so every user-facing string is served from locale files, determined from the `Accept-Language` header on initial SSR — with zero hard-coded strings in templates.

**Independent Test**: Open the app with `Accept-Language: ja` and confirm all labels, placeholders, and button text are in Japanese; open with `Accept-Language: en` or unknown — English shown.

### Tests for User Story 6

> **Write and confirm FAILING before T036–T037**

- [ ] T035 [P] [US6] Write failing E2E scenarios for locale detection in `tests/e2e/looptube.spec.ts` — `Accept-Language: ja` → Japanese strings visible; `Accept-Language: en` → English; no locale header → English fallback

### Implementation for User Story 6

- [ ] T036 [US6] Wire `data.locale` into `src/routes/+page.svelte` — read from server `load()` result (implemented in T011); create `const t = createTranslator(data.locale)`; thread `t` prop to `<Timeline>`, `<ABControls>`, `<PlaybackControls>`, `<LoopList>` (satisfies T035)
- [ ] T037 [US6] Add SC-007 compliance check — Vitest test in `tests/unit/i18n.test.ts` or ESLint rule that scans `src/` for hard-coded user-facing strings not present in `en.json`; exempt tokens: `"LOOPTUBE"`, `"A"`, `"B"`, `"×"`, `"∞"`, `"MM:SS.s"`

**Checkpoint**: US6 independently testable — locale switching works from browser `Accept-Language`; zero hard-coded strings detected by lint/test.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, coverage validation, performance audit, and final integration checks.

- [ ] T038 [P] Verify full Vitest unit + integration test suite: `npm run test:unit && npm run test:integration` — confirm 100% pass rate with zero failures
- [ ] T039 [P] Verify coverage gate: `npx vitest run --coverage` — confirm 100% branch and statement coverage for `src/lib/core/ABLoopStateMachine.ts` and `src/lib/core/SegmentRepository.ts` (constitution VIII)
- [ ] T040 [P] Type check: `npx tsc --noEmit` — confirm zero TypeScript strict-mode errors across all new and modified files
- [ ] T041 [P] Lint: `npm run lint` — confirm zero ESLint errors including import boundary violations (domain modules must not import DOM/Svelte/SvelteKit)
- [ ] T042 Lighthouse audit on 375 px mobile viewport — confirm SC-002 FMP < 2.0 s under Fast 4G throttling; SC-006 accessibility score ≥ 90; each self-hosted font file ≤ 50 KB

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────────────────────────────────┐
  (T001 = FR-016 gate; T002, T003 = tooling)                                 │
                                                                              ▼
Phase 2: Foundational ──────────────────────────────────────────────────────►│
  (T004–T011: i18n module, locale files, ABLoopStateMachine, SSR)            │
  BLOCKS all story phases                                                     │
                                                                              ▼
Phase 3: US1 (P1) ──────────────────────────────────────────────────────►    │
Phase 4: US2 (P1) ── can start in parallel with Phase 3 ────────────────►   │
Phase 5: US3 (P2) ── can start after Phase 2 ───────────────────────────►   │
Phase 6: US4 (P2) ── can start after Phase 2 ───────────────────────────►   │
Phase 7: US5 (P2) ── can start after Phase 2 ───────────────────────────►   │
Phase 8: US6 (P3) ── can start after Phase 2; wires all component t props ──►│
                                                                              ▼
Phase N: Polish ── requires all desired stories complete ────────────────────►│
```

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|-----------|---------------------|
| US1 (P1) | Phase 2 complete | US2, US3, US4, US5 |
| US2 (P1) | Phase 2 complete | US1, US3, US4, US5 |
| US3 (P2) | Phase 2 complete | US1, US2, US4, US5 |
| US4 (P2) | Phase 2 complete, T010 (ABLoop change) | US1, US2, US3, US5 |
| US5 (P2) | Phase 2 complete | US1, US2, US3, US4 |
| US6 (P3) | Phase 2 complete; all components exist (US1–US5 must have `t` prop wired) | — |

### TDD Ordering Within Each Story Phase

```
For each story:
  1. Write failing tests → commit → confirm RED
  2. Implement minimum to make tests pass → commit → confirm GREEN
  3. Refactor → confirm still GREEN
  4. Move to next story
```

### Parallel Opportunities Per Phase

**Phase 2 (tests)**:
- T004 [i18n test], T005 [locale-detector test], T006 [ABLoop test] → all parallel

**Phase 2 (impl)**:
- T008 [en.json], T009 [ja.json] → parallel with each other (depends on T007)

**Phase 3**:
- T012 [E2E test] must be confirmed FAILING first (TDD gate); then T013 [fonts] and T014 [LoopTubeHeader] → parallel with each other

**Phase 4**:
- T019 [drag unit test], T020 [zoom unit test], T021 [E2E drag test] → parallel
- T022 [utils] depends on T019, T020; then T023, T024 depend on T022

**Phase N**:
- T038 [Vitest], T039 [coverage], T040 [tsc], T041 [lint] → all parallel

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1 (Setup — FR-016 gate CRITICAL)
2. Complete Phase 2 (Foundational — blocks all stories)
3. Complete Phase 3 (US1 — dark-theme UI)
4. Complete Phase 4 (US2 — Timeline with zoom)
5. **STOP and VALIDATE**: E2E tests pass; core drag/zoom usable on mobile
6. Deploy/demo if ready

### Incremental Delivery

```
Phase 1+2 → Foundation (SSR, i18n, ABLoop fix)
  ↓
Phase 3 → US1 (dark theme) → demo on device
  ↓
Phase 4 → US2 (Timeline/zoom) → demo drag on device
  ↓
Phase 5+6+7 → US3+US4+US5 (controls) → full controls demo
  ↓
Phase 8 → US6 (i18n wiring) → locale test passes
  ↓
Phase N → Polish → merge-ready
```

### Parallel Team Strategy

After Phase 2 completes:
- Developer A: US1 + US2 (visual UI foundation)
- Developer B: US3 + US4 (controls panel)
- Developer C: US5 + US6 (saved loops + i18n wiring)

Each story phase is independently testable and deployable.

---

## Notes

- `[P]` = different files, no incomplete task dependencies — safe to parallelize
- `[US1]–[US6]` label maps each task to its user story for traceability
- FR-016 gate (T001) is a **user/manual action** — assign a human owner; no automated task can complete it
- Constitution I (TDD): failing tests in each phase MUST be committed before any implementation code in that phase
- Constitution VIII (Coverage gate): T039 must pass 100% for `ABLoopStateMachine` and `SegmentRepository`
- SegmentRepository tests already exist from spec `001-looptube-core`; T010 (ABLoopStateMachine change) requires adding/updating one test scenario (T006) — do not break existing passing tests
