# Data Model: LoopTube UI — 003-implement-looptube-ui

**Phase**: 1 | **Date**: 2026-06-22 | **Plan**: [plan.md](./plan.md)

## Existing Types (unchanged)

### Segment (domain/storage)

Defined in `src/lib/ports/StoragePort.ts`. **Not renamed** — "Segment" remains the
domain term; "Loop" is the user-visible label.

```ts
interface Segment {
  id: string;
  videoId: string;
  name: string;
  pointA: number;   // seconds
  pointB: number;   // seconds
  speed: number;    // playback rate multiplier
  createdAt: Date;
  updatedAt: Date;
}
```

### ABLoopStateMachineState (existing, one field modified)

```ts
type MachineState =
  | { status: 'IDLE' }
  | { status: 'HAS_A'; pointA: number }
  | { status: 'HAS_B'; pointB: number }
  | {
      status: 'LOOPING';
      pointA: number;
      pointB: number;
      loopCount: number | 'infinite';   // ← after finite completion: resets to 'infinite'
      loopsCompleted: number;
      lastSetPoint: 'A' | 'B';
    };
```

**Targeted change**: `tick()` final-repetition branch now sets `loopCount: 'infinite'`
instead of transitioning to `{ status: 'IDLE' }`. All other state transitions are
unchanged.

---

## New Types

### Locale

```ts
// src/lib/i18n/index.ts
type Locale = 'en' | 'ja';
```

### LocaleStrings

Inferred from `en.json` shape. All keys must exist in both `en.json` and `ja.json`.

```ts
type LocaleStrings = {
  error: {
    not_found: string;
    not_embeddable: string;
    invalid_url: string;
    load_failed: string;
  };
  player: {
    url_placeholder: string;
    load: string;
    play: string;
    pause: string;
  };
  loop: {
    set_a: string;
    set_b: string;
    clear_a: string;
    clear_b: string;
    clear_all: string;
    point_a: string;
    point_b: string;
    not_set: string;       // displayed as "—"
  };
  playback: {
    speed: string;
    loop_count: string;
    infinite: string;
    times: string;
    counter: string;       // NEW: "{n} / {m}" — localised template, e.g. "3 / 5"
  };
  loops: {                 // NEW namespace (user-visible "Saved Loops")
    section_heading: string;
    save_placeholder: string;
    save_button: string;
    delete_confirm: string;
    confirm_yes: string;
    confirm_no: string;
    empty: string;
  };
  timeline: {              // NEW namespace
    zoom_in: string;       // aria-label for zoom activate button
    zoom_out: string;      // aria-label for zoom deactivate button
  };
  share: {
    button: string;
    copied: string;
    loop_clamped: string;
  };
};
```

**Note**: The existing `segment.*` namespace in `en.json`/`ja.json` can be retained for
backward compatibility or removed if no existing code references `t('segment.*')`.
The new `loops.*` namespace covers all user-visible "Saved Loops" UI copy.

### ZoomState

```ts
// Managed in +page.svelte — passed to <Timeline> as zoomActive: boolean prop
// (per ui-contracts.md TimelineProps — zoom state is externally controlled)
type ZoomState =
  | { active: false }
  | { active: true; windowStart: number; windowEnd: number };
```

**Derivation**: ZoomState is computed, not persisted. Managed in `+page.svelte` and
passed to `<Timeline>` as the `zoomActive` boolean prop (per `ui-contracts.md`
`TimelineProps`). Derived from `pointA`, `pointB`, and `duration` via
`computeZoomWindow()` when zoom is toggled on via `onZoomToggle`. Resets to
`{ active: false }` when:
- The A-B loop is cleared
- `onZoomToggle` is called again
- `duration` becomes 0 (video unloaded)

**Not included in share URL** — intentional per spec Assumptions.

### DeleteConfirmState

```ts
// Inline in LoopList.svelte (local component state — not exported)
type DeleteConfirmState = string | null;
// null = no row in confirm mode; string = id of the row showing confirm UI
```

At most one row can be in confirm mode at any time.

---

## State Transitions

### ZoomState transitions

```
{ active: false }
    → (user taps zoom button, LOOPING state) → { active: true, windowStart, windowEnd }
    ← (user taps zoom button again)          ← { active: false }
    ← (A-B loop cleared)                     ← { active: false }
    ← (video unloaded)                       ← { active: false }
```

When pointA/pointB is nudged while zoom is active, `windowStart`/`windowEnd` are
recomputed immediately via `computeZoomWindow(pointA, pointB, duration)`.

### DeleteConfirmState transitions

```
null
  → (trash icon tapped on row id) → id
  ← (No button tapped)            ← null
  ← (Yes button tapped → delete)  ← null
  ← (row list changes — $effect)  ← null
```

### ABLoopStateMachine finite-completion transition (modified)

```
LOOPING { loopCount: N, loopsCompleted: N-1 }
  → tick() fires (currentTime ≥ pointB, final repetition)
  → LOOPING { loopCount: 'infinite', loopsCompleted: N }  ← NEW (was: IDLE)
  + action: STOP_AND_SEEK to pointB  ← stops at Point B (per spec US4 scenario 2)
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| pointA, pointB | `0 ≤ pointA < pointB ≤ duration`; min gap 0.1 s |
| drag clamp A | `newA = max(0, min(newA, pointB - 0.1))` |
| drag clamp B | `newB = min(duration, max(newB, pointA + 0.1))` |
| nudge clamp A | Reject (silent) if result would make `A ≥ B` |
| nudge clamp B | Reject (silent) if result would make `B ≤ A` |
| loopCount | `1 ≤ n ≤ 99` (finite) or `'infinite'` |
| locale | `'en' \| 'ja'`; fallback to `'en'` on any other value |
| zoom windowStart | `max(0, pointA - loopLen/2)` |
| zoom windowEnd | `min(duration, pointB + loopLen/2)` |
| Segment.name | Non-empty string after trim |

---

## Key Computations

### Time formatting (MM:SS.s)

```ts
export function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}
// e.g. 75.3 → "01:15.3"
```

Pure TS, testable in Node.

### Zoom window

```ts
export function computeZoomWindow(
  pointA: number,
  pointB: number,
  duration: number
): { windowStart: number; windowEnd: number } {
  const loopLen = pointB - pointA;
  const halfPadding = loopLen / 2;
  return {
    windowStart: Math.max(0, pointA - halfPadding),
    windowEnd: Math.min(duration, pointB + halfPadding),
  };
}
```

### Position-to-seconds (in-component, with zoom awareness)

```ts
function pxToSeconds(
  clientX: number,
  trackRect: DOMRect,
  windowStart: number,
  windowEnd: number
): number {
  const ratio = Math.max(0, Math.min(1, (clientX - trackRect.left) / trackRect.width));
  return windowStart + ratio * (windowEnd - windowStart);
}
```

### Seconds-to-position percent (for marker/playhead CSS `left`)

```ts
function secondsToPercent(
  t: number,
  windowStart: number,
  windowEnd: number
): number {
  return ((t - windowStart) / (windowEnd - windowStart)) * 100;
}
```
