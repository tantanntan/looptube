# Research: LoopTube UI — 003-implement-looptube-ui

**Phase**: 0 | **Date**: 2026-06-22 | **Plan**: [plan.md](./plan.md)

## 1. ABLoopStateMachine — Targeted Finite-Loop Completion Change

### Current behaviour (src/lib/core/ABLoopStateMachine.ts ~line 132)

When the final repetition fires the `tick()` method:

```ts
// Final repetition (current)
this.state = { status: 'IDLE' };
return { type: 'STOP_AND_SEEK', to: s.pointA };
```

This transitions to `IDLE`, clearing all A/B data.

### Required behaviour (US4 scenario 2, spec line 206)

After final repetition: playback stops at Point B; A/B markers remain set; loop state stays
active (remains `LOOPING`); counter resets to ∞ for the next run.

### Minimal diff

```ts
// Final repetition (new)
this.state = {
  ...s,
  loopsCompleted: nextCompleted,
  loopCount: 'infinite',   // resets counter display to ∞
};
return { type: 'STOP_AND_SEEK', to: s.pointB };
```

Consequences:
- `status` stays `'LOOPING'` — no other code path changes
- `loopCount` resets to `'infinite'` so `LoopController` resumes indefinitely if play is
  triggered again
- `loopsCompleted` is set to `nextCompleted` for accuracy (all N loops did complete)
- `STOP_AND_SEEK` to `s.pointB` — `LoopController` pauses the player at Point B
  (per spec US4 scenario 2: "playback stops at Point B")
- All existing `tick()` tests for `infinite` and `finite < N` remain valid; only the
  final-repetition branch needs a new/updated test

### Test impact

One new unit-test scenario in `ABLoopStateMachine.test.ts`:
- Given loopCount=3, after 3rd tick fires: state is `LOOPING`, loopCount=`'infinite'`,
  pointA/pointB preserved, action is `STOP_AND_SEEK` to `pointB`

---

## 2. Pointer Events API for Draggable Timeline Markers

### Approach

Use Pointer Events API (`pointerdown`, `pointermove`, `pointerup`, `setPointerCapture`)
instead of mouse/touch events. This provides:
- Unified touch + mouse + stylus handling
- Capture (marker stays "grabbed" even if pointer moves off the element)
- Works on Evergreen browsers (100% global support)

### Pattern in Svelte 5

```svelte
<div
  role="slider"
  aria-valuemin={0}
  aria-valuemax={duration}
  aria-valuenow={pointA}
  on:pointerdown={handleMarkerPointerDown}
  style="left: {posPercent}%"
>A</div>

<script lang="ts">
  function handleMarkerPointerDown(e: PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    // ... register pointermove/pointerup on window or the element
  }
</script>
```

### Drag clamp logic (pure TS, testable in Node)

```ts
// In a pure helper, no DOM dependency:
export function clampPointA(newA: number, pointB: number, duration: number): number {
  return Math.max(0, Math.min(newA, pointB - 0.1));
}
export function clampPointB(newB: number, pointA: number, duration: number): number {
  return Math.min(duration, Math.max(newB, pointA + 0.1));
}
```

These are the only draggable-marker functions that need unit tests. The DOM interaction
(converting px offset to seconds) lives in the Svelte component and is covered by E2E.

### Timeline coordinate mapping

```ts
// Convert pointer clientX to video seconds — called inside the component
function pxToSeconds(clientX: number, trackEl: HTMLElement, duration: number): number {
  const rect = trackEl.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return ratio * duration; // apply zoom window offset if zoom active
}
```

In zoom mode, `duration` is replaced by `windowEnd - windowStart` and the result is
offset by `windowStart`.

---

## 3. SSR Accept-Language Locale Detection

### SvelteKit pattern

In `src/routes/+page.server.ts` (server-only load function):

```ts
// +page.server.ts — new file for server-only Accept-Language detection
// +page.ts keeps only the removal of ssr=false (or is deleted)
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ request }) => {
  const raw = request.headers.get('accept-language') ?? '';
  const locale = parseLocale(raw); // pure helper — returns 'ja' | 'en'
  return { locale };
};
```

`parseLocale` is a pure TS function (no DOM, testable in Node):

```ts
export function parseLocale(header: string): 'en' | 'ja' {
  const tags = header.split(',').map(t => t.split(';')[0].trim().toLowerCase());
  for (const tag of tags) {
    if (tag === 'ja' || tag.startsWith('ja-')) return 'ja';
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
  }
  return 'en';
}
```

The `locale` value flows to the page component as a `data` prop. No SvelteKit store is
needed — just a `$derived` locale accessor.

### SSR safety for YouTube player

`FakeVideoPlayer` is already injected on the server during SSR (existing code). The
`onMount` replaces it with `YouTubePlayerAdapter`. SSR re-enablement is safe as long as
no direct `window` / `document` access exists outside `onMount` / `browser` guards.
Audit: `+page.svelte` already wraps all YouTube init in `onMount`, so no changes needed.

---

## 4. i18n Architecture — Simple key-value lookup (no library)

### Rationale for no external library

Two locales (`en`, `ja`), static at SSR time, no runtime switching. An external library
(i18next, inlang, typesafe-i18n) adds bundle weight and complexity that is not justified.
A thin hand-rolled accessor is sufficient and testable.

### Schema

```ts
// src/lib/i18n/index.ts
export type Locale = 'en' | 'ja';

export type LocaleStrings = typeof import('./en.json');

export function createTranslator(locale: Locale): (key: string) => string {
  const dict = locale === 'ja' ? jaStrings : enStrings;
  return (key: string) => getNestedKey(dict, key) ?? key; // key itself as fallback
}
```

Nested key accessor (`"loop.set_a"` → `dict.loop.set_a`) is a trivial recursive lookup
— no external library required.

### Key additions needed in locale files

Current `en.json` uses `"segment.*"` namespace. The following keys need to be updated or
added for this feature:

| Namespace | Key | Current (en) | Required change |
|-----------|-----|------|------|
| `segment.empty` | empty | "No saved segments for this video." | Rename namespace to `loops` OR keep and add `loops.empty` |
| `loops.section_heading` | — | MISSING | "Saved Loops" (en) / "保存済みループ" (ja) |
| `loops.save_placeholder` | — | MISSING | "Loop name (e.g. Chorus bar 4)" |
| `loops.save_button` | — | MISSING | "Save" / "保存" |
| `loops.delete_confirm` | — | MISSING | "Delete?" / "削除しますか？" |
| `loops.confirm_yes` | — | MISSING | "Yes" / "はい" |
| `loops.confirm_no` | — | MISSING | "No" / "いいえ" |
| `loops.empty` | — | MISSING | "No saved loops yet" / "まだ保存済みループはありません" |
| `playback.counter` | — | MISSING | "{n} / {m}" — parameterised |
| `timeline.zoom_in` | — | MISSING | "Zoom" / "ズーム" (aria-label) |
| `timeline.zoom_out` | — | MISSING | "Reset zoom" / "ズームをリセット" |

**Decision**: Add a `loops.*` namespace (keeping existing `segment.*` for domain code
that still uses "segment"); update `playback.*` to add counter; add `timeline.*` for
zoom button aria labels.

---

## 5. Zoom State — Calculation and Component Architecture

### ZoomState type

```ts
type ZoomState =
  | { active: false }
  | { active: true; windowStart: number; windowEnd: number };
```

### Zoom window calculation

When zoom activates with `pointA` and `pointB` set:

```ts
function computeZoomWindow(
  pointA: number,
  pointB: number,
  duration: number
): { windowStart: number; windowEnd: number } {
  const loopLen = pointB - pointA;
  // Expand so the A-B region fills 50% of the window
  const halfPadding = loopLen / 2;
  const start = Math.max(0, pointA - halfPadding);
  const end = Math.min(duration, pointB + halfPadding);
  return { windowStart: start, windowEnd: end };
}
```

This guarantees the A-B region occupies exactly 50% of the window width (FR-005). Pure
TS, no DOM — fully unit-testable.

### Re-centering after nudge

After any nudge while zoom is active, the window is recomputed from the new pointA/pointB.
The spec says: "the zoom window re-centers to include both markers". `computeZoomWindow`
already handles this when called with updated marker positions.

### Zoom button visibility

The zoom button is shown only when `machineState.status === 'LOOPING'` (both A and B set).
It is rendered conditionally in the parent, not disabled.

---

## 6. Font Subsetting Strategy

### Approach

Use `pyftsubset` (from the `fonttools` Python package) to subset each font to the Unicode
ranges actually used by the app:

| Font | Usage | Unicode range to keep |
|------|-------|----------------------|
| Barlow | LOOPTUBE logotype, headings | Latin Basic (U+0020–U+007E) |
| Noto Sans JP | Japanese body text | CJK Unified Ideographs subset used by ja.json strings |
| Roboto Mono | Timestamps (digits, colon, dot, spaces) | U+0020–U+003A, U+002E |

Target: ≤ 50 KB per file (SC-002). Barlow and Roboto Mono will be well under 20 KB after
subsetting to Latin Basic + digits. Noto Sans JP requires careful subsetting to the exact
CJK characters in use.

### Build step

A one-time script (`scripts/subset-fonts.sh`) downloads fonts from the design project
`uploads/` directory and runs `pyftsubset`. The resulting `.woff2` files are committed
to `static/fonts/`. No CI font subsetting step is needed after the initial commit.

### CSS @font-face declarations

Declared in `src/app.css` (global) or `src/routes/+layout.svelte`:

```css
@font-face {
  font-family: 'Barlow';
  src: url('/fonts/barlow/barlow-semibold.woff2') format('woff2');
  font-weight: 600;
  font-display: swap;
}
```

`font-display: swap` ensures the UI is usable with system fallback during font load.

---

## 7. Delete-with-Inline-Confirmation Pattern

### State

`deleteConfirmId: string | null` — at most one row in confirm mode at a time. Stored as
`$state` in `LoopList.svelte`.

### Behaviour

- Tap trash icon on row `id`: `deleteConfirmId = id`
- Row replaces trash icon with "Delete? [Yes] [No]"
- Tap Yes: call `onDelete(id)`, then `deleteConfirmId = null`
- Tap No: `deleteConfirmId = null`
- Loading a different loop or any navigation: `deleteConfirmId = null` (reset on prop
  change via `$effect`)

---

## 8. Unresolved Items

None. All `NEEDS CLARIFICATION` markers were resolved in the `/speckit-clarify` sessions.
All technical questions above are resolved with a concrete approach.
