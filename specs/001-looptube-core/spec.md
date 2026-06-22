# Feature Specification: LoopTube Core — A-B Repeat Playback

**Feature Branch**: `001-looptube-core`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "Build LoopTube — a web service that lets users A-B repeat any
section of a YouTube music video for practice, ear training, and language learning."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Load a Video and Set an A-B Loop (Priority: P1)

A first-time visitor pastes a YouTube URL into the input field. The video loads in the
embedded player. They press Play, then press A while the music is at the start of a phrase
they want to practice, and press B when the phrase ends. The segment immediately begins
looping. They adjust the endpoints with the fine-tune buttons until the loop is exactly right.

**Why this priority**: This is the entire core value proposition. Without it, the product
does not exist. Every other story depends on this working flawlessly.

**Independent Test**: Can be tested by loading any public YouTube video, setting A and B
points, and confirming that playback loops within the defined segment indefinitely.

**Acceptance Scenarios**:

1. **Given** a user enters a valid YouTube URL or video ID, **When** they submit it,
   **Then** the embedded player loads the video within 3 seconds and the video ID
   appears in the page URL query string.

2. **Given** a video is loaded and playing, **When** the user presses A,
   **Then** Point A is set to the current playback position (± 0.1 s accuracy).

3. **Given** both Point A and Point B are set and A < B, **When** playback reaches
   Point B, **Then** the player automatically seeks back to Point A and continues
   playing, looping indefinitely.

4. **Given** a loop is active, **When** the user clicks the ± 0.1 s fine-tune buttons,
   **Then** Point A or B shifts by exactly 0.1 seconds and the loop adjusts immediately.

5. **Given** a video is loaded but the URL is unavailable or non-embeddable,
   **When** the user submits it, **Then** a clear, human-readable error message is
   displayed and no player is shown.

---

### User Story 2 — Playback Controls and Speed Adjustment (Priority: P2)

A language learner wants to slow down a phrase to hear individual sounds. They set an A-B
loop and reduce playback speed to 0.5×. After a few repetitions they increase the count to
10 so the loop plays exactly 10 times before stopping.

**Why this priority**: Speed control and repeat count are key differentiators for practice
use cases. They are independent of storage and authentication.

**Independent Test**: Can be verified by confirming speed selector and loop count input
are functional with any active A-B loop.

**Acceptance Scenarios**:

1. **Given** an active A-B loop, **When** the user selects 0.5× speed,
   **Then** playback slows to half speed without interrupting the loop.

2. **Given** an active A-B loop with loop count set to 5, **When** the loop completes
   its 5th repetition, **Then** playback stops and the position returns to Point A.

3. **Given** an active loop, **When** the user sets loop count to "infinite",
   **Then** the loop continues indefinitely until manually stopped.

---

### User Story 3 — Keyboard Shortcuts (Priority: P2)

A musician has both hands near the keyboard while practicing. They use keyboard shortcuts
exclusively: Space to pause, A/B to set points, arrow keys to seek, Shift+arrows to nudge
points, and Escape to clear the loop.

**Why this priority**: Keyboard shortcuts are essential for hands-free practice workflow
and are entirely client-side with no storage dependencies.

**Independent Test**: Can be verified by confirming all listed key bindings trigger
their respective actions in isolation.

**Acceptance Scenarios**:

1. **Given** a loaded video, **When** the user presses Space, **Then** playback
   toggles between playing and paused.

2. **Given** a playing video, **When** the user presses ← or →,
   **Then** the playback position shifts by ±5 seconds.

3. **Given** an active A-B loop, **When** the user presses Escape,
   **Then** both Point A and Point B are cleared and looping stops.

4. **Given** an active A-B loop, **When** the user presses Shift+← or Shift+→,
   **Then** the most recently set point (A or B) nudges by ±0.1 seconds.

---

### User Story 4 — Save, List, and Load Named Segments (Priority: P3)

An ear-training student saves a tricky chord change as "Verse bridge — bar 4". Later they
return to the site, paste the same video URL, and find their saved segment waiting in the
list below the player. They click to load it and continue practicing.

**Why this priority**: Persistence unlocks returning-user value. Unauthenticated localStorage
persistence is sufficient for Phase 1 MVP; server-side sync is the authenticated upgrade path.

**Independent Test**: Can be tested end-to-end for unauthenticated users using only
localStorage, without any server or authentication setup.

**Acceptance Scenarios**:

1. **Given** an A-B loop is active, **When** the user enters a name and clicks Save,
   **Then** the segment is saved and appears in the segment list below the player.

2. **Given** a saved segment exists for the current video, **When** the user reloads
   the page with the same video ID in the URL, **Then** the segment list is populated
   from storage without any user action.

3. **Given** a saved segment in the list, **When** the user clicks Load,
   **Then** Point A and Point B are restored and the loop activates immediately.

4. **Given** a saved segment in the list, **When** the user clicks Delete,
   **Then** the segment is removed from the list and from storage.

---

### User Story 5 — Share a Loop via URL (Priority: P3)

A teacher wants to share a specific passage of a song with a student. They click Share,
copy the generated URL, and send it. The student opens the URL and the video loads
with the loop already configured and playing.

**Why this priority**: Sharing is a lightweight but high-value social feature requiring
no authentication and no server state.

**Independent Test**: Can be tested by generating a share URL, opening it in a fresh
browser tab, and confirming the loop auto-loads.

**Acceptance Scenarios**:

1. **Given** an active A-B loop, **When** the user clicks Share,
   **Then** a URL is generated encoding the video ID, Point A, Point B, and speed,
   and is copied to the clipboard.

2. **Given** a share URL with encoded loop parameters, **When** the URL is opened
   in a browser, **Then** the video loads and the loop activates automatically
   with the encoded parameters.

---

### User Story 6 — Google Login and Server-Side Segment Sync (Priority: P4)

A power user wants their segments available on all devices. They log in with Google.
The segments they saved locally are merged into their account. On a second device they
log in and find all their segments.

**Why this priority**: Authentication and server sync are deferred to Phase 2; P1 core
loop works entirely without login.

**Independent Test**: Can be tested by creating localStorage segments, logging in, and
verifying segments appear in the server-side list on a second device.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user with localStorage segments, **When** they log in
   with Google, **Then** their local segments are merged into their server-side account
   and appear in the segment list.

2. **Given** an authenticated user, **When** they save a segment,
   **Then** it is persisted to the server and retrievable on any device after login.

3. **Given** a user is logged in, **When** they delete a segment,
   **Then** it is removed from the server and no longer appears on any device.

---

### Edge Cases

- What happens when the user sets Point B before Point A? The UI MUST prevent looping
  and display a validation message ("Point B must be after Point A").
- What happens when Point A and Point B are identical? The loop MUST NOT activate;
  display an error ("Loop segment must have non-zero length").
- What happens when the video is shorter than the requested seek position from a share URL?
  Clamp the values to [0, video duration] and notify the user.
- What happens when localStorage is full? Display a non-blocking warning and allow the
  user to delete old segments.
- What happens when an authenticated user's server API is unavailable? The save/delete
  operation fails with a visible error notification; A-B loop playback continues
  uninterrupted. No localStorage fallback is provided for authenticated users in Phase 1.
- What happens when the user enters an invalid YouTube URL? Show a specific error with
  an example of valid formats.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST accept YouTube URLs in `youtube.com/watch?v=ID`,
  `youtu.be/ID`, and bare video ID formats as input.
- **FR-002**: The system MUST validate submitted video IDs and display a human-readable
  error for unavailable or non-embeddable videos.
- **FR-003**: The video ID MUST be reflected in the page URL query string at all times,
  enabling direct linking to any loaded video.
- **FR-004**: Users MUST be able to set Point A and Point B independently while the
  video is playing or paused.
- **FR-005**: When both Point A and Point B are set and A < B, the player MUST loop
  the segment between them continuously until the loop is cleared or overridden.
- **FR-006**: Users MUST be able to fine-tune Point A and Point B in ±0.1-second
  increments via dedicated buttons.
- **FR-007**: Users MUST be able to clear Point A, Point B, or both simultaneously.
- **FR-008**: The progress bar MUST visually indicate the current playback position,
  Point A, and Point B.
- **FR-009**: Users MUST be able to select playback speed from: 0.5×, 0.75×, 1.0×,
  1.25×, 1.5×, 2.0×.
- **FR-010**: Users MUST be able to set loop count to a specific integer (1–99) or
  infinite. After the final repetition the player MUST stop and return to Point A.
- **FR-011**: The following keyboard shortcuts MUST be supported: A (set Point A),
  B (set Point B), Space (play/pause), ← / → (seek ±5 s), Shift+← / Shift+→
  (nudge the most recently set point by ±0.1 s), Escape (clear A-B loop).
  The `ABLoopStateMachine` MUST track which point (A or B) was set most recently
  and expose it as `lastSetPoint` for the keyboard handler.
- **FR-012**: Unauthenticated users MUST be able to save named segments to local storage,
  keyed by video ID. Saving with an existing `(videoId, name)` pair MUST overwrite the
  existing segment (upsert) without a confirmation dialog.
- **FR-013**: Authenticated users' segments MUST be persisted to a server-side database
  via API and retrievable across devices. If the API is unavailable, the save operation
  MUST fail with a visible error notification; all A-B loop and playback functionality
  MUST continue to operate normally. There is no automatic localStorage fallback for
  authenticated users in Phase 1.
- **FR-014**: On login, any segments stored locally MUST be merged into the user's
  server-side segment collection.
- **FR-015**: The segment list MUST allow users to load or delete any saved segment.
- **FR-016**: A Share button MUST generate a URL encoding video ID, Point A, Point B,
  and speed. Opening the URL MUST restore all encoded parameters automatically.
- **FR-017**: Google OAuth MUST be supported for user authentication.
- **FR-018**: No login MUST be required to use the A-B loop or save segments locally.
- **FR-019**: All interactive controls MUST conform to WCAG 2.1 Level AA. This includes
  keyboard operability for all functions, sufficient colour contrast (≥ 4.5:1 for
  normal text), visible focus indicators, and programmatic labels on all form controls.

### Key Entities

- **Video**: Identified by a YouTube video ID; carries no server-stored metadata in Phase 1.
- **Segment**: A named A-B loop for a specific video. Attributes: `id`, `videoId`, `name`,
  `pointA` (seconds), `pointB` (seconds), `speed` (multiplier — persisted),
  `createdAt`, `updatedAt`. `loopCount` is a session-only setting and is NOT part of
  the persisted Segment entity. The combination `(videoId, name)` is unique per owner
  (user or localStorage scope); saving with an existing `(videoId, name)` performs an
  upsert (overwrite) without a confirmation dialog. Owned by a User (authenticated)
  or stored in local storage (unauthenticated).
- **User**: An authenticated account linked to a Google OAuth identity. Owns server-side
  segments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can load a video, set an A-B loop, and hear it repeating within
  60 seconds of arriving at the site for the first time.
- **SC-002**: Point A and Point B are set with ≤ 0.1 second accuracy relative to the
  playback position at the moment of the keypress or button press.
- **SC-003**: A saved segment loads and activates the loop within 1 second of the user
  clicking Load.
- **SC-004**: A generated share URL restores the loop in a fresh browser tab within
  3 seconds of the page load completing.
- **SC-005**: All core A-B loop and playback control features are fully usable on a
  375 px-wide mobile viewport without horizontal scrolling.
- **SC-006**: All user-facing text is available in both Japanese (ja) and English (en)
  with no hardcoded strings in the UI layer.
- **SC-007**: All interactive controls meet WCAG 2.1 Level AA criteria, including:
  keyboard operability (SC 2.1.1), sufficient colour contrast (SC 1.4.3, minimum 4.5:1
  for normal text), visible focus indicators (SC 2.4.7), and labelled form controls
  (SC 1.3.1).

## Clarifications

### Session 2026-06-22

- Q: Shift+← / Shift+→ で操作される "focused point" はどのように決まるか？ → A: 直近にセット（A または B を押した）した点がフォーカスされる。`ABLoopStateMachine` は `lastSetPoint` プロパティで追跡する。
- Q: セグメント保存時、`speed` と `loopCount` も永続化されるか？ → A: `speed` は常にセグメントと共に保存。`loopCount` はセッション限定で保存しない。
- Q: 認証済みユーザーのサーバー API が利用不可の場合、アプリはどう振る舞うか？ → A: 保存操作は失敗としてエラー通知を表示。ループ再生機能は継続して動作。localStorage への自動フォールバックなし。
- Q: 同じ動画・同じ名前でセグメントを保存した場合どうなるか？ → A: 既存セグメントを上書き（upsert）。確認ダイアログなし。`(videoId, name)` はオーナースコープ内でユニーク制約。
- Q: 目標とすべき WCAG 準拠レベルは？ → A: WCAG 2.1 Level AA（コントラスト・フォーカス・キーボード操作・ラベル）。

## Assumptions

- The YouTube IFrame Player API is available and not blocked in the user's region; no
  fallback playback mechanism is provided in Phase 1.
- Users are expected to have a modern browser (Chrome, Firefox, Safari, Edge — latest
  two major versions).
- Server-side database technology is not specified here; any relational or document store
  accessible from SvelteKit server routes is acceptable.
- "Merge on login" follows a last-write-wins strategy per `(videoId, segmentName)` pair;
  conflict resolution UI is out of scope for Phase 1.
- Playback speed (`speed`) is persisted as part of the Segment entity whenever a
  segment is saved or updated. Loop count (`loopCount`) is a session-only setting
  and is never persisted.
- The Share URL length is assumed to be within standard browser URL limits
  (well under 2 KB given the data encoded).
- Pitch correction independent of playback speed is explicitly out of scope for Phase 1.
