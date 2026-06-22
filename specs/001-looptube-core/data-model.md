# Data Model: LoopTube Core

**Branch**: `001-looptube-core` | **Date**: 2026-06-22

## Domain Entities

### Segment

The central persisted entity. Represents a named A-B loop for a specific YouTube video.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | string (cuid2) | PK | Server-generated for DB; locally generated UUID for localStorage |
| `userId` | string | FK → User.id, NOT NULL (DB only) | Absent in localStorage schema |
| `videoId` | string | NOT NULL | YouTube video ID (e.g., `dQw4w9WgXcQ`) |
| `name` | string | NOT NULL, max 100 chars | User-supplied label |
| `pointA` | float | NOT NULL, ≥ 0 | Loop start in seconds |
| `pointB` | float | NOT NULL, > pointA | Loop end in seconds |
| `speed` | float | NOT NULL, default 1.0 | One of: 0.5, 0.75, 1.0, 1.25, 1.5, 2.0 |
| `createdAt` | timestamp | NOT NULL, default now() | |
| `updatedAt` | timestamp | NOT NULL, default now(), on update | |

**Uniqueness constraint**: `(userId, videoId, name)` is unique in the DB.
For localStorage: `(videoId, name)` is unique within the scope of the current browser.

**Invariant**: `pointA < pointB` MUST be enforced by `SegmentRepository.save()` before
delegating to `StoragePort.upsert()`.

**Speed invariant**: `speed` MUST be one of the six permitted values. Enforced by
`SegmentRepository.save()`.

**Upsert semantics**: Saving with an existing `(owner, videoId, name)` overwrites the
existing segment without a confirmation dialog (per clarification 2026-06-22).

---

### User

Represents an authenticated Google OAuth account. Only exists server-side; never stored
in localStorage.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | string (cuid2) | PK | |
| `email` | string | NOT NULL, UNIQUE | From Google OAuth |
| `name` | string | NOT NULL | Display name |
| `avatarUrl` | string \| null | nullable | Google profile photo URL |
| `createdAt` | timestamp | NOT NULL, default now() | |

---

## StorageLike Interface

`LocalStorageAdapter` MUST accept a `StorageLike` dependency via its constructor so that
integration tests can run in Node (Vitest) without `window.localStorage`:

```typescript
// src/lib/adapters/LocalStorageAdapter.ts
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalStorageAdapter implements StoragePort {
  constructor(private storage: StorageLike = window.localStorage) {}
  // ...
}
```

Integration tests inject a `MapBackedStorage` (pure in-memory `StorageLike`):

```typescript
// tests/integration/LocalStorageAdapter.test.ts
class MapBackedStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
}
// No window, no browser — runs cleanly in Vitest Node environment.
```

---

## Client-Side Storage (localStorage)

Unauthenticated users' segments are stored in `localStorage` with the following structure:

```
key:   "looptube:segments:{videoId}"
value: JSON map of { [name: string]: LocalSegmentRecord }
```

```typescript
interface LocalSegmentRecord {
  id: string;        // locally generated UUID v4
  videoId: string;
  name: string;
  pointA: number;
  pointB: number;
  speed: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

On login, all localStorage segments are read, sent to `POST /api/segments/merge`, and
then cleared from localStorage.

---

## Port Interfaces

### StoragePort

```typescript
// src/lib/ports/StoragePort.ts
export interface Segment {
  id: string;
  videoId: string;
  name: string;
  pointA: number;
  pointB: number;
  speed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentInput {
  videoId: string;
  name: string;
  pointA: number;
  pointB: number;
  speed: number;
}

export interface MergeResult {
  merged: number;  // segments successfully upserted
  skipped: number; // segments rejected due to validation errors
}

export interface StoragePort {
  listByVideoId(videoId: string): Promise<Segment[]>;
  upsert(input: SegmentInput): Promise<Segment>;
  delete(id: string): Promise<void>;
  mergeAll(segments: SegmentInput[]): Promise<MergeResult>;
}
```

**Owner-scope contract**: `StoragePort` instances are **owner-scoped at construction time**.
Adapters receive the owner context (userId or localStorage scope) in their constructor;
the port methods never accept a userId parameter directly. This keeps domain logic
user-agnostic while preventing cross-owner data access at the adapter level.

```typescript
// Server-side (per-request):
const storage = new DatabaseStorageAdapter(db, session.userId);
// storage.listByVideoId() implicitly filters by session.userId
// storage.delete(id) adds WHERE userId = session.userId — 403 if mismatch

// Client-side (unauthenticated):
const storage = new LocalStorageAdapter(); // scoped to window.localStorage
```

`DatabaseStorageAdapter.delete(id)` MUST verify `segment.userId === this.userId`
and throw a `ForbiddenError` if they differ. Integration tests MUST include a
cross-user delete attempt that expects 403.
```

### VideoPlayerPort

```typescript
// src/lib/ports/VideoPlayerPort.ts
export type VideoLoadError =
  | { code: 'NOT_FOUND' }        // YouTube error 100: video not found
  | { code: 'NOT_EMBEDDABLE' }   // YouTube error 101/150: embedding disallowed
  | { code: 'UNKNOWN'; message: string };

export interface VideoPlayerPort {
  loadVideo(videoId: string): Promise<{ ok: true } | { ok: false; error: VideoLoadError }>;
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
  onReady(callback: () => void): void;
  onStateChange(callback: (state: PlayerState) => void): void;
  onError(callback: (error: VideoLoadError) => void): void;
  destroy(): void;
}

export type PlayerState = 'UNSTARTED' | 'ENDED' | 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'CUED';
```

### TimerPort

```typescript
// src/lib/ports/TimerPort.ts
export interface TimerPort {
  setInterval(callback: () => void, ms: number): TimerHandle;
  clearInterval(handle: TimerHandle): void;
  setTimeout(callback: () => void, ms: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
}
export type TimerHandle = symbol;
```

### RouterPort

```typescript
// src/lib/ports/RouterPort.ts
export interface RouterPort {
  getParam(key: string): string | null;
  setParam(key: string, value: string): void;
  removeParam(key: string): void;
  getUrl(): string;
}
```

---

## ABLoopStateMachine

A pure TypeScript state machine with no DOM, Svelte, or adapter dependencies. Lives in
`src/lib/core/ABLoopStateMachine.ts`.

### States

```
IDLE
  setA(t)  →  HAS_A { pointA: t }
  setB(t)  →  HAS_B { pointB: t }

HAS_A
  setB(t), t > pointA  →  LOOPING { pointA, pointB: t }
  setB(t), t ≤ pointA  →  HAS_A (no-op; returns error: 'B_BEFORE_A')
  clearA               →  IDLE
  setA(t)              →  HAS_A { pointA: t }   (replace A)

HAS_B
  setA(t), t < pointB  →  LOOPING { pointA: t, pointB }
  setA(t), t ≥ pointB  →  HAS_B (no-op; returns error: 'A_AFTER_B')
  clearB               →  IDLE
  setB(t)              →  HAS_B { pointB: t }   (replace B)

LOOPING
  clearA               →  HAS_B
  clearB               →  HAS_A
  clearAll / Escape    →  IDLE
  setA(t)              →  LOOPING { pointA: t }  (replace A; validates t < pointB)
  setB(t)              →  LOOPING { pointB: t }  (replace B; validates t > pointA)
```

### State Shape

```typescript
type ABLoopState =
  | { status: 'IDLE' }
  | { status: 'HAS_A';    pointA: number; lastSetPoint: 'A' }
  | { status: 'HAS_B';    pointB: number; lastSetPoint: 'B' }
  | { status: 'LOOPING';  pointA: number; pointB: number; lastSetPoint: 'A' | 'B';
      loopCount: number | 'infinite'; loopsCompleted: number };
```

### tick() Contract

```typescript
type TickAction =
  | { type: 'NONE' }
  | { type: 'SEEK'; to: number }
  | { type: 'STOP_AND_SEEK'; to: number };   // final repetition complete

// Called by LoopController on every timer tick:
tick(currentTime: number): TickAction
```

When `status === 'LOOPING'` and `currentTime >= pointB`:
- If `loopCount === 'infinite'`: return `{ type: 'SEEK', to: pointA }` and increment `loopsCompleted`
- If `loopsCompleted + 1 < loopCount`: return `{ type: 'SEEK', to: pointA }` and increment
- If `loopsCompleted + 1 === loopCount`: return `{ type: 'STOP_AND_SEEK', to: pointA }` and transition to IDLE

---

## LoopController (src/lib/services/)

`LoopController` is a **thin adapter orchestrator with zero business logic**. It lives in
`src/lib/services/` (outside `core/`) and is therefore excluded from the 100% coverage gate.

Its sole responsibilities are:
1. Start/stop the `TimerPort` interval (polling `ABLoopStateMachine.tick()`)
2. Read `player.getCurrentTime()` and pass it into `tick()`
3. Execute the returned `TickAction` against the player (`seekTo` / stop)

All conditional logic (state transitions, guard conditions, loop count) lives in
`ABLoopStateMachine`. If `LoopController` ever acquires conditional logic, that logic MUST
be moved into `ABLoopStateMachine` instead.

```typescript
// src/lib/services/LoopController.ts
class LoopController {
  constructor(
    private machine: ABLoopStateMachine,
    private player: VideoPlayerPort,
    private timer: TimerPort,
  ) {}

  start(): void {
    this.timer.setInterval(() => {
      const action = this.machine.tick(this.player.getCurrentTime());
      if (action.type === 'SEEK') this.player.seekTo(action.to);
      else if (action.type === 'STOP_AND_SEEK') {
        this.player.seekTo(action.to);
        this.player.pause();
      }
    }, 50); // 50 ms polling — no business logic, just dispatch
  }

  stop(): void { this.timer.clearInterval(/* handle */); }
}
```

---

## UrlSerializer

Pure TypeScript module in `src/lib/core/UrlSerializer.ts`.

Encodes/decodes share URL parameters:

| URL param | Segment field | Format |
|---|---|---|
| `v` | `videoId` | raw string |
| `a` | `pointA` | decimal seconds, 1 decimal place |
| `b` | `pointB` | decimal seconds, 1 decimal place |
| `s` | `speed` | decimal multiplier (e.g., `0.75`) |

**Example**: `https://looptube.io/?v=dQw4w9WgXcQ&a=63.2&b=78.5&s=0.75`

Parsing is split into two stages to keep `UrlSerializer` duration-agnostic:

**Stage 1 — URL syntax parse** (pure, no duration needed):

```typescript
// Returns structurally valid values. `warnings` lists parameters that were
// defaulted or that may need duration-clamping once the player is ready.
type ParseResult =
  | { ok: false; errors: string[] }
  | { ok: true; videoId: string; pointA: number; pointB: number; speed: number;
      warnings: string[] };  // e.g. ["pointA may exceed video duration"]
```

**Stage 2 — Duration-aware validation** (called after `onReady()` fires):

```typescript
// src/lib/core/UrlSerializer.ts
function clampToDuration(
  parsed: ParseResult & { ok: true },
  duration: number
): { pointA: number; pointB: number; clamped: boolean; message?: string }
```

If any value was clamped, `clamped: true` and `message` contains a user-visible
notification string (retrieved from the i18n locale via a key, not a hardcoded string).
