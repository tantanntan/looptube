# UI Contracts: LoopTube UI — 003-implement-looptube-ui

**Phase**: 1 | **Date**: 2026-06-22 | **Plan**: [../plan.md](../plan.md)

These contracts define the Svelte 5 component API boundaries (props and events) for all
new and modified components. Implementation must satisfy these contracts exactly —
they are the interface between the page orchestrator (`+page.svelte`) and the components.

All props use Svelte 5 runes (`$props()`). Event callbacks are plain function props
(no `createEventDispatcher`).

---

## New Components

### Timeline.svelte

Replaces `ProgressBar.svelte`. Renders the scrub track with draggable A/B markers,
a moving playhead, the optional A-B highlighted region, and the zoom toggle button.

```ts
interface TimelineProps {
  // Playback state
  currentTime: number;       // seconds — drives playhead position
  duration: number;          // seconds — denominator for full-video mapping

  // A/B markers (null = not set)
  pointA: number | null;
  pointB: number | null;

  // Zoom state (controlled externally)
  zoomActive: boolean;

  // Locale strings for aria-labels
  t: (key: string) => string;

  // Callbacks — called with new value in seconds
  onDragA: (seconds: number) => void;
  onDragB: (seconds: number) => void;
  onZoomToggle: () => void;      // called when zoom button is tapped
  onSeek: (seconds: number) => void;  // called when user taps outside markers
}
```

**Contract notes**:
- Zoom button is rendered only when `pointA !== null && pointB !== null`
- Drag clamp logic (`clampPointA`, `clampPointB`) is applied inside the component before
  calling `onDragA` / `onDragB`
- Pointer Events API (`pointerdown`, `pointermove`, `pointerup`, `setPointerCapture`)
  used for cross-device drag support
- Playhead moves whenever `currentTime` prop changes (no internal timer)
- The A-B highlighted region is rendered only when both `pointA` and `pointB` are set

**Accessibility**:
- A/B marker elements have `role="slider"`, `aria-valuemin={0}`, `aria-valuemax={duration}`,
  `aria-valuenow={pointA | pointB}`, `aria-label={t('loop.point_a') | t('loop.point_b')}`
- Zoom button has `aria-label={zoomActive ? t('timeline.zoom_out') : t('timeline.zoom_in')}`
- Zoom button has `aria-pressed={zoomActive}`

---

### LoopTubeHeader.svelte

Renders the LOOPTUBE brand logotype using Barlow typeface. Static — no props required
beyond optional locale for ARIA.

```ts
interface LoopTubeHeaderProps {
  // No props — "LOOPTUBE" is exempt from locale files per FR-003
}
```

---

### LoopList.svelte

Replaces `SegmentList.svelte`. Renders the "Saved Loops" section with inline
delete-with-confirmation.

```ts
interface LoopListProps {
  loops: Segment[];          // from SegmentRepository (domain type, not renamed)
  t: (key: string) => string;

  // Callbacks
  onLoad: (segment: Segment) => void;
  onDelete: (id: string) => void;
}
```

**Contract notes**:
- Section heading (`t('loops.section_heading')`) is ALWAYS rendered regardless of `loops.length`
- When `loops.length === 0`: render `t('loops.empty')` placeholder
- At most one row is in delete-confirm mode at any time (managed by internal `$state`)
- Delete confirm row shows: `t('loops.delete_confirm')` + Yes (`t('loops.confirm_yes')`)
  and No (`t('loops.confirm_no')`) buttons
- Tapping Yes calls `onDelete(id)` and closes confirm mode
- Tapping No closes confirm mode with no action
- Any change to `loops` prop resets confirm mode (`$effect` watching `loops`)

**Accessibility**:
- Delete (trash) button: `aria-label={t('loops.delete')} aria-describedby="{rowId}-name"`
- Confirm Yes/No buttons: labelled with their text content
- List is a `<ul>` with `<li>` items; each row is keyboard navigable

---

## Modified Components

### ABControls.svelte

Updated to hide (not disable) nudge and clear buttons when the corresponding point is
not set, and to use i18n strings.

```ts
interface ABControlsProps {
  pointA: number | null;
  pointB: number | null;
  t: (key: string) => string;   // NEW

  onSetA: () => void;
  onSetB: () => void;
  onNudgeA: (delta: number) => void;
  onNudgeB: (delta: number) => void;
  onClearA: () => void;
  onClearB: () => void;
  onClearAll: () => void;
}
```

**Contract notes**:
- Nudge (−0.1 s / +0.1 s) buttons for A are hidden when `pointA === null`
- Nudge buttons for B are hidden when `pointB === null`
- Clear A (`onClearA`) hidden when `pointA === null`
- Clear B (`onClearB`) hidden when `pointB === null`
- Clear All (`onClearAll`) hidden when both points are null
- Timestamp displayed in `MM:SS.s` format; "—" when point is not set
- "—" text is the visual display of `t('loop.not_set')` (locale file value may differ)

---

### PlaybackControls.svelte

Updated to add 0.25× speed option and display the N/M finite-loop counter.

```ts
interface PlaybackControlsProps {
  speed: number;
  loopCount: number | 'infinite';
  loopsCompleted: number;        // NEW: needed for N/M display
  t: (key: string) => string;   // NEW

  onSpeedChange: (speed: number) => void;
  onLoopCountChange: (count: number | 'infinite') => void;
}
```

**Speed options** (ordered): `[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]`

**Loop counter display logic**:
- `loopCount === 'infinite'`: show "∞" (exempt from locale per FR-003)
- `loopCount > 0` and in active loop: show `"{loopsCompleted} / {loopCount}"`
- Counter display is read from `t('playback.counter')` template if parameterised, or
  computed as `${loopsCompleted} / ${loopCount}` inline

**Accessibility**:
- Speed selector: `role="group"`, `aria-label={t('playback.speed')}`
- Each speed button: `aria-pressed={speed === option}`, `aria-label="{option}×"`
- Loop count input: `type="number"`, `min="1"`, `max="99"`, `aria-label={t('playback.loop_count')}`

---

## Page Orchestrator Changes (+page.svelte)

The page component is **not** a contract document subject — it is the composition root.
Key changes it must make:

1. Accept `data.locale` from the server `load` function and construct `t()` from it
2. Thread `t` prop to all components that accept it
3. Replace `<ProgressBar>` with `<Timeline>` passing `zoomActive`, `onZoomToggle`,
   `onDragA`, `onDragB`, `onSeek`
4. Replace `<SegmentList>` with `<LoopList>`
5. Add `<LoopTubeHeader>` at the top
6. Pass `loopsCompleted={machineState.status === 'LOOPING' ? machineState.loopsCompleted : 0}`
   to `<PlaybackControls>`
7. Manage `zoomActive: boolean` state and `computeZoomWindow` in page scope

---

## Locale Accessor Contract

```ts
// src/lib/i18n/index.ts — public API
export type Locale = 'en' | 'ja';

export function createTranslator(locale: Locale): (key: string) => string;

export function parseLocale(acceptLanguageHeader: string): Locale;
```

**`createTranslator` contract**:
- Returns a function `t(key: string) => string`
- `key` uses dot notation: `"loop.set_a"`, `"loops.empty"`, `"timeline.zoom_in"`, etc.
- Missing key: returns the key itself (never throws)
- Exempt tokens ("LOOPTUBE", "A"/"B", "×", "∞", "MM:SS.s") are not in locale files —
  they are rendered as literals in component templates

**`parseLocale` contract**:
- Parses RFC 5646 Accept-Language header
- Returns `'ja'` for tags starting with `"ja"` (case-insensitive)
- Returns `'en'` for tags starting with `"en"` or as fallback
- Pure function, no side effects — testable in Node without any browser or SvelteKit context
