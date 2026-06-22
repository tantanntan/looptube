# API Contract: Segment Endpoints

> ⚠️ **Phase 2 only** — These endpoints are NOT implemented in Phase 1.
> Phase 1 uses `LocalStorageAdapter` exclusively; no server-side API routes exist.
> This contract defines the interface for Phase 2 implementation.

**Base**: `/api/segments` (SvelteKit `+server.ts` routes)
**Auth**: Session cookie via `@auth/sveltekit`. Unauthenticated requests to
authenticated-only endpoints return `401`.

All request/response bodies are `application/json`.
All timestamps are ISO 8601 strings.

---

## GET /api/segments?videoId={videoId}

List all saved segments for the authenticated user filtered by video ID.

**Authentication**: Required (401 if not logged in)

**Query parameters**:
| Param | Type | Required | Description |
|---|---|---|---|
| `videoId` | string | ✅ | YouTube video ID |

**Response 200**:
```json
{
  "segments": [
    {
      "id": "cuid2_value",
      "videoId": "dQw4w9WgXcQ",
      "name": "Chorus - bar 4",
      "pointA": 63.2,
      "pointB": 78.5,
      "speed": 0.75,
      "createdAt": "2026-06-22T10:00:00.000Z",
      "updatedAt": "2026-06-22T10:00:00.000Z"
    }
  ]
}
```

**Response 400**: `{ "error": "videoId query parameter is required" }`
**Response 401**: `{ "error": "Unauthorized" }`

---

## POST /api/segments

Save (upsert) a segment. If a segment with the same `(videoId, name)` already exists
for the authenticated user, it is overwritten. Returns the saved segment.

**Authentication**: Required (401 if not logged in)

**Request body**:
```json
{
  "videoId": "dQw4w9WgXcQ",
  "name": "Chorus - bar 4",
  "pointA": 63.2,
  "pointB": 78.5,
  "speed": 0.75
}
```

**Validation rules**:
- `videoId`: non-empty string, max 20 chars
- `name`: non-empty string, max 100 chars
- `pointA`: number ≥ 0
- `pointB`: number > `pointA`
- `speed`: one of `[0.5, 0.75, 1.0, 1.25, 1.5, 2.0]`

**Response 200** (upserted existing):
```json
{
  "segment": { /* full Segment object */ }
}
```

**Response 201** (created new):
```json
{
  "segment": { /* full Segment object */ }
}
```

**Response 400**:
```json
{
  "error": "Validation failed",
  "details": { "pointB": "must be greater than pointA" }
}
```

**Response 401**: `{ "error": "Unauthorized" }`

---

## DELETE /api/segments/:id

Delete a segment by ID. Only the owning user may delete their own segments.

**Authentication**: Required

**Path parameters**:
| Param | Type | Description |
|---|---|---|
| `id` | string (cuid2) | Segment ID |

**Response 204**: No content (success)

**Response 401**: `{ "error": "Unauthorized" }`

**Response 403**: `{ "error": "Forbidden" }` — segment exists but belongs to another user

**Response 404**: `{ "error": "Segment not found" }`

---

## POST /api/segments/merge

Merge localStorage segments into the authenticated user's server-side collection.
Called automatically on login. Uses upsert semantics per segment: existing
`(videoId, name)` entries are overwritten (last-write-wins).

**Authentication**: Required

**Request body**:
```json
{
  "segments": [
    {
      "videoId": "dQw4w9WgXcQ",
      "name": "Chorus - bar 4",
      "pointA": 63.2,
      "pointB": 78.5,
      "speed": 0.75
    }
  ]
}
```

**Constraints**: Maximum 200 segments per merge request. Invalid individual segments
(failed validation) are **skipped** — the rest continue to be processed. The response
reports counts for both outcomes. This matches `StoragePort.mergeAll()` which returns
`Promise<MergeResult>` with `{ merged, skipped }`.

**Response 200**:
```json
{
  "merged": 3,
  "skipped": 1
}
```
`merged`: segments successfully upserted.
`skipped`: segments rejected due to per-item validation errors (invalid pointA/pointB,
unknown speed value, etc.). Skipped segments do not cause the entire request to fail.

**Response 400**: `{ "error": "segments must be a non-empty array" }`

**Response 401**: `{ "error": "Unauthorized" }`
