# Quickstart: LoopTube Core

**Branch**: `001-looptube-core` | **Date**: 2026-06-22

This guide validates the feature implementation from a user's perspective.
Run through each scenario after implementation to confirm the feature works end-to-end.

## Prerequisites

- Node.js 20+ and npm/pnpm installed
- `.env.local` configured (see Environment Setup below)
- Dev server running: `pnpm dev` (or `npm run dev`)

## Environment Setup

```bash
# .env.local (Phase 1 — no database or auth required)
PUBLIC_BASE_URL="http://localhost:5173"

# Phase 2 only (not needed for Phase 1 scenarios 1–5):
# DATABASE_URL="file:./dev.db"
# AUTH_SECRET="<generate with: openssl rand -base64 32>"
# AUTH_GOOGLE_ID="<Google OAuth client ID>"
# AUTH_GOOGLE_SECRET="<Google OAuth client secret>"
```

---

## Scenario 1: Load a Video and Set an A-B Loop (P1 — Core)

1. Open `http://localhost:5173`
2. Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`) and press Enter
3. **Verify**: The video loads in the embedded player; the URL bar shows `?v=dQw4w9WgXcQ`
4. Press Play, let it play for a few seconds
5. Press **A** on the keyboard (or click the A button)
6. **Verify**: "Point A: X.X s" label updates; progress bar shows the A marker
7. Continue playing, then press **B**
8. **Verify**: Loop activates immediately; player seeks back to A on reaching B
9. Click the **+0.1** button next to Point B
10. **Verify**: Point B shifts by exactly 0.1 seconds

**Expected**: Loop plays continuously between A and B with correct endpoint accuracy (±0.1 s)

---

## Scenario 2: Playback Speed and Loop Count

1. With an active A-B loop, open the Speed selector
2. Select **0.5×**
3. **Verify**: Playback slows; loop continues without interruption
4. Set Loop Count to **3**
5. **Verify**: After the 3rd completion, playback stops and returns to Point A

---

## Scenario 3: Keyboard Shortcuts

1. Press **Space** → video pauses; press again → resumes
2. Press **←** → position moves back 5 seconds
3. Press **→** → position moves forward 5 seconds
4. Set Point A with **A**, then press **Shift+←** → Point A nudges back 0.1 s
5. Set Point B with **B**, then press **Shift+→** → Point B (most recently set) nudges forward 0.1 s
6. Press **Escape** → both A and B cleared; looping stops

---

## Scenario 4: Save and Load Segments (Unauthenticated)

1. Set an A-B loop with a distinct name (e.g., "bar 4 chorus")
2. Click **Save** — segment appears in the list below the player
3. Reload the page with the same video URL
4. **Verify**: The segment list is populated from localStorage; click **Load** → loop restores
5. Click **Delete** → segment removed from the list and from localStorage

---

## Scenario 5: Share URL

1. Set an active A-B loop with speed 0.75×
2. Click **Share** → URL is copied to clipboard
3. Open a new browser tab and paste the URL
4. **Verify**: Video loads, loop activates with the correct A, B, and speed values

---

## Scenario 6: Google Login and Server Sync (P4 — Phase 2 only)

> ⚠️ This scenario requires Phase 2 implementation (Auth.js, Drizzle ORM, PostgreSQL).
> It is NOT part of Phase 1. Skip when testing Phase 1.

1. Save 2 segments while unauthenticated
2. Click **Login with Google** and authenticate
3. **Verify**: Both segments now appear in the list (merged to server)
4. Open a private/incognito window, log in again
5. **Verify**: Both segments are visible on the second device

---

## Scenario 7: Accessibility (WCAG 2.1 AA)

1. Open the player page with a loaded video
2. Press **Tab** repeatedly — confirm every interactive control receives a visible focus ring
3. Confirm all buttons and inputs have accessible labels (check via browser DevTools → Accessibility panel)
4. Verify colour contrast for key text elements meets 4.5:1 ratio (use DevTools colour picker)
5. Run `pnpm test:e2e --grep accessibility` — axe-core must report zero violations

---

## Scenario 8: i18n — Language Switching

1. Open the app in English (default or `?lang=en`)
2. Switch to Japanese (`?lang=ja`) and confirm all visible UI strings change
3. **Verify**: No visible hardcoded English strings remain in the Japanese locale
4. Run `pnpm test:e2e --grep i18n` — confirms no hardcoded strings are rendered

---

## Running Tests

```bash
# Unit tests (pure TypeScript, no browser)
pnpm test:unit

# Integration tests (real SQLite DB, no browser)
pnpm test:integration

# E2E tests (Playwright, requires dev server running)
pnpm test:e2e

# Coverage report (must reach 100% for core/)
pnpm test:unit --coverage
```

## CI Gate Order

1. `pnpm test:unit` must pass before integration tests begin
2. `pnpm test:integration` must pass before E2E tests begin
3. `pnpm test:e2e` runs last
4. `pnpm test:unit --coverage` enforces 100% branch coverage on `src/lib/core/**`
