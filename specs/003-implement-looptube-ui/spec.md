# Feature Specification: LoopTube UI — Implement LoopTube.dc.html Design

**Feature Branch**: `003-implement-looptube-ui`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "Make sure the claude_design MCP connector is connected. Then use the claude_design MCP tools to import this project: https://claude.ai/design/p/22934576-e45f-4f40-ad9a-5a47dbc2260a?file=LoopTube.dc.html — Implement: LoopTube.dc.html"

**Revised**: 2026-06-22 — Scope expanded from "presentation only" to full feature implementation.

## Context

The foundational A-B repeat engine is already implemented (spec `001-looptube-core`).
This feature delivers a complete, production-ready LoopTube by implementing **both** the
visual design from `LoopTube.dc.html` **and** the new interactive capabilities shown in
that design. Several features visible in the design do not yet exist in the codebase and
require new implementation:

- **Draggable timeline markers** — the existing progress bar has no drag support
- **Timeline zoom** — a new on/off toggle that auto-fits the A-B region to the visible track
- **i18n locale system** — no string externalisation or locale detection exists yet
- **0.25× speed option** — not in the current speed list
- **Delete-with-confirmation on saved loops** — not currently implemented

This is a full-stack feature spanning new interaction logic, UI components, and visual
styling.

The design source (`LoopTube.dc.html`) is the authoritative visual reference and is
available in the claude.ai design project
`22934576-e45f-4f40-ad9a-5a47dbc2260a` (project name: "モバイル対応ページ設計").

## Clarifications

### Session 2026-06-22 (re-specify)

- Scope correction: feature is NOT presentation-only. Draggable markers, timeline zoom, i18n, 0.25× speed, and delete-with-confirmation are all NEW capabilities requiring implementation. Context and Assumptions updated accordingly.

- Q: Are the Web fonts (Barlow, Noto Sans JP, Roboto Mono) self-hosted or loaded from an external CDN? → A: Self-hosted — fonts are bundled as static assets from the design project's `uploads/` directory. No external font CDN dependency.
- Q: When the user drags a timeline A/B marker past the other marker, what should happen? → A: Block — the drag is stopped at (other marker ± 0.1 s minimum gap); the marker cannot cross the other point.
- Q: How is the active locale determined? → A: Accept-Language header — the server reads the `Accept-Language` request header on initial page load (SvelteKit SSR) to select `ja` or `en`; English is the fallback.
- Q: Should user-visible UI copy say "loops" (design term) or "segments" (domain model term)? → A: "Loops" in all user-visible text; "Segment" remains the domain/code term. The mapping is documented in Key Entities.
- Q: Is the timeline zoom a single auto-fit toggle or can the user manually adjust the zoom level? → A: Single auto-fit toggle only — one button fits the A-B region to ≥ 50% of the timeline width; no pinch or slider control.

### Session 2026-06-22 (clarify round 2)

- Q: Delete confirmation UI type? → A: Inline expand — tapping the trash icon replaces the row with "Delete? [Yes] [No]"; no modal or native dialog.
- Q: Loop count display during active finite countdown? → A: "N / M" progress format (e.g., "3 / 5"); resets to "∞" on completion.
- Q: Saved Loops empty state? → A: Section heading always visible; "No saved loops yet" placeholder shown when 0 loops exist for the current video.
- Q: Zoom button state when no A-B loop set? → A: Hidden — button appears only after both Point A and Point B are set; "disabled" approach rejected.
- Q: Include zoom state in URL share link? → A: No — share link encodes only v/a/b/speed; zoom state is a transient viewing aid excluded from shared URLs.

### Session 2026-06-22 (Codex review fixes)

- **[High]** US5 "rename" out of scope: removed "rename" from story text; inline rename has no acceptance scenario or FR. Delete-with-confirmation only.
- **[High]** Design artifacts local path: added requirement to export `LoopTube.dc.html` + screenshots to `specs/003-implement-looptube-ui/design-refs/` before implementation; updated Assumptions.
- **[Medium]** Drag mode clarification: FR-006 updated to explicitly say "both full-video view and zoom mode"; US2 scenario 8 added for drag in full-video view.
- **[Medium]** Hidden vs disabled: US3 acceptance scenario 3 changed to "hidden" only, matching FR-008.
- **[Medium]** Finite loop completion state: US4 acceptance scenario 2 extended — playback stops at Point B; A/B markers remain set; loop state stays active; counter resets to ∞.
- **[Low]** Hard-coded string exemptions: FR-003 and SC-007 now explicitly exempt "LOOPTUBE", "A"/"B", "×", "∞", "MM:SS.s" from locale/lint checks.
- Edge Case: removed incorrect claim that app respects `prefers-color-scheme`; dark theme is exclusive, light mode is out of scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — First Impression: Polished Dark-Theme UI on Mobile (Priority: P1)

A first-time visitor opens LoopTube on their smartphone. They see a clean, dark-background
interface with the LOOPTUBE logotype at the top. The layout fills the screen naturally — the
YouTube embed occupies the top portion, and all controls are within easy thumb reach below.
There is no horizontal scrolling and no squashed text.

**Why this priority**: The design is the product's first and most persistent impression.
A poorly styled UI discourages repeated use. All other stories depend on the visual design
being in place first.

**Independent Test**: Can be verified by opening the app on a 375 px-wide viewport (e.g.,
iPhone SE) and confirming the layout matches the LoopTube.dc.html reference without overflow,
truncated labels, or visual regressions.

**Acceptance Scenarios**:

1. **Given** the app is opened on a mobile device (≤ 480 px viewport width), **When** the
   page loads, **Then** all UI elements fit within the viewport width without horizontal
   scrolling and text is legible (minimum 14 px effective size).

2. **Given** the app is opened on a desktop browser, **When** the page loads, **Then** the
   layout adapts to wider viewports (centered, max-width container) while preserving the
   dark theme and visual hierarchy.

3. **Given** the page loads, **When** the user views the header, **Then** the LOOPTUBE
   logotype is visible in the brand typeface (Barlow) at the top of the page.

4. **Given** the page loads, **When** no video is loaded, **Then** the YouTube embed area
   displays a placeholder with a URL input field prominently centered.

5. **Given** any state of the app, **When** the user observes interactive elements (buttons,
   inputs, sliders), **Then** focus indicators are visible and all touch targets are at
   least 44 × 44 px.

---

### User Story 2 — Visual Scrub Timeline with Zoom (Priority: P1)

A musician has set an A-B loop over a fast guitar phrase. The phrase is only 2 seconds
long in a 4-minute song. They tap the "zoom" button on the timeline and the scrub bar
automatically expands to show only the region around the loop, making the A and B markers
easy to drag and fine-tune with their finger. Tapping the zoom button again returns to the
full-video view.

**Why this priority**: The scrub timeline with zoom is the primary differentiator over
basic A-B repeat tools. Without zoom, users cannot precisely adjust short loops on a
small touch screen — the markers would be only a few pixels apart.

**Independent Test**: Can be verified end-to-end by loading any video, setting a short
A-B loop (< 10 seconds), activating zoom, and confirming the A/B markers become visually
separated and individually draggable.

**Acceptance Scenarios**:

1. **Given** a video is loaded and an A-B loop is active, **When** the user views the
   scrub timeline, **Then** a highlighted region between the A and B markers is visible
   on the track.

2. **Given** an active A-B loop, **When** the user taps or clicks the zoom button,
   **Then** the timeline automatically fits the A-B region so it occupies at least 50%
   of the visible timeline width (auto-fit, not user-adjustable zoom level).

3. **Given** the timeline is in zoom mode, **When** the user drags the A marker left or
   right, **Then** Point A updates in real time and the loop adjusts immediately without
   interrupting playback. If dragging A would make A ≥ B, the drag is blocked at
   (B − 0.1 s).

4. **Given** the timeline is in zoom mode, **When** the user drags the B marker,
   **Then** Point B updates in real time with the same behaviour as Point A. If dragging B
   would make B ≤ A, the drag is blocked at (A + 0.1 s).

5. **Given** the timeline is in zoom mode, **When** the user taps outside the A-B region,
   **Then** the playhead seeks to that position.

6. **Given** the timeline is in zoom mode, **When** the user taps the zoom button again,
   **Then** the timeline returns to the full-video view.

7. **Given** the playhead is playing, **When** the user observes the timeline in any mode,
   **Then** the playhead indicator moves smoothly in real time (update rate ≥ 10 fps).

8. **Given** the timeline is in full-video view (zoom not active) and an A-B loop is set,
   **When** the user drags the A or B marker, **Then** the marker moves and the loop
   boundaries update in real time — identical drag behaviour to zoom mode but at the
   proportionally smaller scale of the full video duration.

---

### User Story 3 — Redesigned A/B Controls Panel (Priority: P2)

A language learner sets Point A and wants to nudge it back half a second to include the
leading consonant. They see the A/B controls panel with the current timestamps shown
clearly. They tap the "−0.1 s" button next to Point A three times. The timestamp updates
immediately and the loop shifts on each tap without stopping playback.

**Why this priority**: The A/B controls are used in every session. Clear labelling and
responsive feedback reduce frustration and errors.

**Independent Test**: Can be verified by loading a video, setting A and B, and confirming
that each nudge button tap updates the timestamp label and loop boundary instantly.

**Acceptance Scenarios**:

1. **Given** Point A is set, **When** the user views the A/B panel, **Then** the current
   timestamp for Point A is displayed in `MM:SS.s` format next to the A label.

2. **Given** Point A is set, **When** the user taps the −0.1 s button,
   **Then** Point A decreases by exactly 0.1 s, the displayed timestamp updates immediately,
   and the loop boundary shifts without interrupting playback.

3. **Given** neither point is set, **When** the user views the A/B panel,
   **Then** both point labels read "—" (not set) and the nudge/clear buttons are hidden.

4. **Given** an active A-B loop, **When** the user taps the "Clear" (×) button on Point A,
   **Then** Point A is cleared, the loop deactivates, and the A label returns to "—".

5. **Given** both points are set and the result of a nudge would make A ≥ B,
   **When** the user taps the +0.1 s button on Point A, **Then** the action is rejected
   silently (Point A stays at its current value, no loop interruption).

---

### User Story 4 — Speed and Loop-Count Controls (Priority: P2)

A student wants to hear a phrase at 75% speed 5 times. They tap the speed selector, choose
0.75×, then set the loop count to 5. The app loops the phrase five times at slow speed and
stops automatically.

**Why this priority**: Speed and count controls are frequently used together for targeted
practice. They must be accessible in a single glance without scrolling.

**Independent Test**: Can be verified by setting speed to 0.75× and loop count to 5,
confirming 5 complete loops at the reduced speed before automatic stop.

**Acceptance Scenarios**:

1. **Given** an active A-B loop, **When** the user selects a speed from the panel
   (0.25×, 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×), **Then** playback rate changes
   immediately and the selected speed is visually highlighted.

2. **Given** a finite loop count is set (e.g., 5), **When** the loop completes that many
   repetitions, **Then** playback stops at Point B; Point A and Point B markers remain
   set; the loop state remains active; and the counter resets to "∞" (infinite) so the
   user may trigger the loop again without re-entering points.

3. **Given** the loop count is set to "∞", **When** the user observes the counter,
   **Then** no countdown is shown and the loop continues indefinitely.

4. **Given** a finite loop count is set (e.g., 5) and looping is in progress,
   **When** the user observes the counter after the 3rd repetition begins,
   **Then** the counter displays the current/total format (e.g., "3 / 5").

---

### User Story 5 — Saved Loops Section (Priority: P2)

A guitarist returns to a video they practiced yesterday. Their saved loop "Verse solo —
bars 5–8" appears in the "Saved Loops" section. They tap it. Point A and B are restored
and the loop starts playing immediately. They can delete it inline. (Inline rename is out of scope for this feature.)

**Why this priority**: Persistent loops are the primary reason users return to the app.
The saved loops section must be fast to scan and one-tap to activate.

**Independent Test**: Can be verified by saving a loop, reloading the page with the
same video ID in the URL, and confirming the loop appears and loads correctly.

**Acceptance Scenarios**:

1. **Given** at least one saved loop exists for the current video, **When** the page
   loads, **Then** the "Saved Loops" section is populated automatically without any user
   action.

2. **Given** no saved loops exist for the current video, **When** the user views the
   page, **Then** the "Saved Loops" section heading is visible and an empty-state
   placeholder message (e.g., "No saved loops yet") is shown in place of the list.

3. **Given** the "Saved Loops" section is visible, **When** the user taps a loop row,
   **Then** Point A and B are restored, the loop activates, and playback begins from
   Point A.

4. **Given** a loop row is visible, **When** the user taps the delete (trash) icon,
   **Then** the row expands inline to show "Delete? [Yes] [No]" buttons (replacing the
   trash icon); on tapping Yes, the loop is removed from the list and storage; on
   tapping No, the row returns to its normal state with no change.

5. **Given** an active A-B loop is set, **When** the user enters a name in the "Save
   this loop" field and taps Save, **Then** the loop appears at the top of the saved
   loops list.

6. **Given** more than 5 loops are saved for a video, **When** the user views the
   section, **Then** the list is scrollable and all loops are accessible.

---

### User Story 6 — i18n: Japanese and English Localisation (Priority: P3)

A Japanese music student opens the app. All labels, buttons, placeholders, and error
messages are displayed in Japanese. An English speaker opens the same URL in a browser
set to English and sees the English version. The language is determined automatically
from the browser's language preference — no manual switching is required.

**Why this priority**: Japanese is one of the two primary target locales. Externalising
strings also reduces future maintenance cost for any language.

**Independent Test**: Can be verified by checking that every visible user-facing string
is served from locale files, and that opening the app with the browser's preferred language
set to `ja` vs `en` shows the correct strings.

**Acceptance Scenarios**:

1. **Given** the user's browser sends `Accept-Language: ja` (or `ja-JP`), **When** the
   page loads, **Then** all user-facing strings (labels, placeholders, button text, error
   messages, section headings) are displayed in Japanese.

2. **Given** the user's browser sends `Accept-Language: en`, **When** the page loads,
   **Then** all user-facing strings are displayed in English.

3. **Given** an unsupported locale in the `Accept-Language` header, **When** the page
   loads, **Then** English strings are displayed as the fallback.

4. **Given** any locale, **When** the user encounters an error (invalid URL, unavailable
   video), **Then** the error message is displayed in the active locale.

---

### Edge Cases

- What happens when the viewport is narrower than 320 px? All controls must remain
  operable; no element may overflow or be clipped.
- What happens when the timeline zoom button is tapped but no A-B loop is set? The zoom
  button is hidden until both Point A and Point B are set.
- What happens when the timeline zoom window would place both A and B markers outside
  the visible area after a nudge? The zoom window re-centers to include both markers.
- What happens when the user drags a timeline A marker past Point B? The drag is blocked
  at (B − 0.1 s); the same applies to B dragged before A (blocked at A + 0.1 s).
- What happens when the user drags a timeline marker beyond the video duration? The
  marker is clamped to `[0, duration]`.
- What happens when a saved loop's video is no longer embeddable? The loop row remains
  in the list; an inline error is shown only when the user attempts to load it.
- What happens when the OS theme preference is light mode? The app uses the dark theme
  exclusively and ignores `prefers-color-scheme`; light-mode support is out of scope.
- What happens if a web font fails to load? The UI must remain fully usable with system
  font fallbacks; no layout breakage is acceptable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST render a fully styled, dark-theme UI matching the
  visual specification in `LoopTube.dc.html` on all target viewports.

- **FR-002**: The layout MUST be mobile-first: the base styles target 375 px width and
  wider viewports receive progressive enhancements only.

- **FR-003**: Every user-facing string (labels, button text, placeholders, error messages,
  section headings, ARIA labels) MUST be loaded from locale files — none may be
  hard-coded in markup. **Exempt tokens** (no locale file entry required): the brand name
  "LOOPTUBE", point labels "A"/"B" (internationally recognised), unit symbols "×" and
  "∞", and the time-format pattern "MM:SS.s".

- **FR-004**: The Japanese (`ja`) and English (`en`) locales MUST both be fully
  translated at launch.

- **FR-005**: The scrub timeline MUST support a single-toggle zoom mode: one button
  automatically fits the A-B region to fill at least 50% of the visible timeline width
  (auto-fit). No manual zoom level adjustment (pinch, slider) is required. The zoom
  button MUST be hidden when no A-B loop is set (both Point A and Point B must be set for the button to appear).

- **FR-006**: Timeline A/B markers MUST be draggable (touch and mouse) in **both
  full-video view and zoom mode** and MUST update the loop boundaries in real time without
  interrupting playback. Dragging a marker past the other marker MUST be blocked at a
  minimum gap of 0.1 s.

- **FR-007**: A/B point timestamps MUST be displayed in `MM:SS.s` format.

- **FR-008**: Nudge buttons (−0.1 s / +0.1 s) for Point A and Point B MUST be present
  and MUST be hidden when the corresponding point is not set.

- **FR-009**: Speed options MUST include: 0.25×, 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×.
  The currently active speed MUST be visually highlighted.

- **FR-010**: The loop count control MUST support both a finite integer (1–99) and
  infinite (∞) modes. During active finite looping, the counter MUST display
  current/total progress in "N / M" format (e.g., "3 / 5"). On completion, the
  counter resets to "∞" and the total is cleared.

- **FR-011**: The "Saved Loops" section MUST appear below the controls and list all
  saved loops for the current video (displayed as "loops" to the user; stored internally
  as segments), each with a one-tap load action and a delete action with inline
  confirmation: tapping the trash icon expands the row to show "Yes" / "No" confirm
  buttons (replacing the icon); no modal or native dialog is used. The section heading
  MUST always be visible; when no saved loops exist for the current video, an empty-state
  placeholder message (e.g., "No saved loops yet") MUST appear in place of the list.

- **FR-012**: All interactive elements MUST have a minimum touch target size of 44 × 44 px.

- **FR-013**: All interactive elements MUST have visible focus indicators meeting WCAG 2.1
  AA contrast requirements.

- **FR-014**: The design MUST use the Barlow typeface for the LOOPTUBE logotype and
  headings, Noto Sans JP for body text in the Japanese locale, and Roboto Mono for
  timestamp and numeric readouts. All three typefaces MUST be self-hosted as static
  assets (no external font CDN); font files are sourced from the design project's
  `uploads/` directory.

- **FR-015**: The active locale MUST be determined from the `Accept-Language` HTTP
  request header on the initial server-side render. English (`en`) is the fallback when
  no supported locale is detected.

- **FR-016 (Pre-implementation Requirement)**: The design source file `LoopTube.dc.html`
  and any associated reference screenshots MUST be exported from the claude.ai design
  project and committed to `specs/003-implement-looptube-ui/design-refs/` **before any
  implementation work begins**. This is a readiness gate: implementation tasks that
  depend on the visual reference MUST NOT start until this artefact is present in the
  repository.

### Key Entities

- **Locale File**: A key-value map of string identifiers to translated strings for a
  single language (e.g., `en.json`, `ja.json`). Owns all user-visible copy.
- **Timeline Zoom State**: The current on/off state and computed visible window (start,
  end in seconds) of the scrub timeline zoom. Derived automatically from Point A / B;
  not user-adjustable.
- **Loop Row** (UI term) / **Segment** (domain/code term): A user-visible row in the
  "Saved Loops" section representing a saved A-B loop. Displays: name, Point A timestamp,
  Point B timestamp, speed. Actions: load (one-tap) and delete (with confirmation).
  Internally stored and retrieved as a `Segment` record via `SegmentRepository`.

## Success Criteria *(mandatory)*

- **SC-001**: On a 375 px viewport, every core task (load video, set A, set B, activate
  zoom, save loop, load saved loop) can be completed without horizontal scrolling.

- **SC-002**: The first meaningful paint of the app shell (excluding the YouTube iframe
  and its API script, which are third-party and outside this feature's control) occurs
  within 2.0 seconds on a 375 px mobile viewport under Lighthouse "Fast 4G" throttling.
  Self-hosted fonts (Barlow, Noto Sans JP, Roboto Mono) MUST be subset to the glyphs
  actually used by the app so that no single font file exceeds 50 KB transfer size.

- **SC-003**: The app displays the correct locale (`ja` or `en`) immediately on initial
  page load, determined from the browser's `Accept-Language` header — no client-side
  language flash.

- **SC-004**: A-B marker drag events update the loop boundary within one display frame
  (≤ 16 ms per update at 60 fps).

- **SC-005**: Every interactive element is reachable via keyboard Tab navigation and
  activatable with Enter or Space.

- **SC-006**: Lighthouse Accessibility score ≥ 90 in both mobile and desktop audits.

- **SC-007**: Zero user-facing strings are hard-coded in Svelte templates or TypeScript
  source files (validated by automated lint rule or test). Exempt tokens matching FR-003
  ("LOOPTUBE", "A"/"B", "×", "∞", "MM:SS.s") MUST be excluded from this check to
  prevent false positives.

## Assumptions

- The existing core logic (`SegmentRepository`, `LoopController`, `UrlSerializer`,
  `KeyboardHandler`) is complete and passes all tests. **This spec adds new interaction
  features and UI capabilities on top of the existing core**. It does introduce one
  targeted change to `ABLoopStateMachine`: the finite-loop completion behaviour must
  keep A/B points set and loop state active rather than transitioning to IDLE (see US4
  scenario 2). All other state-machine behaviour and storage contracts are unchanged.
  New components (drag event handling, zoom state, locale system) did not previously
  exist and are purely additive.
- The Barlow, Noto Sans JP, and Roboto Mono typeface files are available in the claude.ai
  design project's `uploads/` directory and will be extracted and self-hosted as static
  web font assets. No Google Fonts or other external CDN is used.
- The `LoopTube.dc.html` file in the claude.ai design project
  (`22934576-e45f-4f40-ad9a-5a47dbc2260a`) is the single source of truth for spacing,
  colour values, typography, and layout. Any ambiguity in this spec is resolved by
  referring to that file. **Before implementation begins**, this file and any associated
  screenshots MUST be exported and committed to
  `specs/003-implement-looptube-ui/design-refs/` so that reviewers and CI can access them
  without a live claude.ai session.
- Server-side rendering (SSR) **must be enabled for this route**. The current route sets
  `ssr = false`; this feature requires enabling SSR so that the `Accept-Language` header
  is readable on the initial server render for locale detection (FR-015). Player-dependent
  UI must still render a static placeholder on the server and hydrate on the client — this
  is already handled by the existing `FakeVideoPlayer`.
- Touch event handling for draggable timeline markers may require pointer events API;
  older browser support is not required (Evergreen browsers only).
- The `prefers-color-scheme: dark` variant is the primary, designed-first theme. A light
  theme is out of scope for this spec.
- All user-visible text uses "loop" / "loops" (e.g., "Saved Loops", "Save this loop").
  The domain model continues to use "segment" / `Segment` in code, type definitions, and
  API layer — there is no renaming of existing domain types.
- The "Share" link URL encodes only `v` (video ID), `a` (Point A), `b` (Point B), and
  `speed`. The timeline zoom state is intentionally excluded — it is a transient viewing
  aid and the recipient defaults to full-video view on open.
