# Research: LoopTube Core

**Branch**: `001-looptube-core` | **Date**: 2026-06-22

## 1. OAuth for SvelteKit (Google Login)

**Decision**: `@auth/sveltekit` (Auth.js v5)

**Rationale**: Auth.js v5 reached stable release and is the de-facto standard for SvelteKit
OAuth. Official SvelteKit adapter, Google provider built-in, session cookies with CSRF
protection out of the box. Lucia-auth v3 was archived/deprecated by its maintainer in late
2024; the maintainer explicitly recommends migrating to Auth.js for new projects.

**Alternatives considered**: Lucia v3 (archived), Arctic + custom session (high boilerplate),
Clerk (vendor lock-in).

**Packages**: `@auth/sveltekit`, `@auth/core`

---

## 2. ORM + Database

**Decision**: Drizzle ORM + PostgreSQL (production) + better-sqlite3 (dev / CI tests)

**Rationale**: Drizzle is the preferred ORM for SvelteKit in 2026: zero runtime overhead,
SQL-first, excellent TypeScript inference, and identical schema API for both PostgreSQL
(`drizzle-orm/pg-core`) and SQLite (`drizzle-orm/sqlite-core`). For CI integration tests,
plain `better-sqlite3` with an in-process SQLite file eliminates any Docker dependency while
keeping migration parity with production via `drizzle-kit`. Prisma remains viable but its
binary query engine adds ~40 MB and startup latency; Prisma's SQLite→Postgres parity also
has known edge cases.

**Alternatives considered**: Prisma (heavier), Kysely (no migrations), raw SQL.

**Packages**: `drizzle-orm`, `drizzle-kit`, `better-sqlite3` (dev/test), `postgres` (prod)

---

## 3. i18n in SvelteKit

**Decision**: Paraglide JS (`@inlang/paraglide-sveltekit`)

**Rationale**: Paraglide is purpose-built for SvelteKit with an official adapter. It generates
tree-shakeable per-language JS bundles at compile time — unused locale strings are never
shipped to the browser. Integrates directly with SvelteKit routing for locale-aware URLs.
`svelte-i18n` is runtime-based, loads all locale JSON on startup, and has larger bundle
implications. For a ja/en two-locale app, Paraglide's compile-time approach is strictly
better.

**Alternatives considered**: svelte-i18n (runtime, larger bundle), typesafe-i18n (less
SvelteKit-integrated), rosetta (no SvelteKit adapter).

**Packages**: `@inlang/paraglide-sveltekit`

---

## 4. YouTube IFrame Player API TypeScript Types

**Decision**: `@types/youtube` — add `/// <reference types="@types/youtube" />` in the
adapter file (`YouTubePlayerAdapter.ts`) only.

**Rationale**: `@types/youtube` (DefinitelyTyped) is the only community-maintained type
package for the YouTube IFrame API; Google has not shipped official types. In a Vite/SvelteKit
project, the `YT` global is injected by the IFrame API script at runtime, so Vite does not
auto-resolve ambient globals. Adding the reference directive at the top of the adapter file
is the correct scoped approach — it avoids polluting `app.d.ts` with a global that
business-logic modules should never reference directly (per constitution Principle III).

**Caveat**: `YT.Player` constructor MUST be called only after `window.onYouTubeIframeAPIReady`
fires; the adapter must gate instantiation on this callback.

**Packages**: `@types/youtube` (devDependency)

---

## 5. ESLint Import Boundary Enforcement

**Decision**: `eslint-plugin-boundaries`

**Rationale**: The most mature solution for architectural zone enforcement. Configure with
`elements` mapping (`core`, `ports`, `adapters`, `fakes`, `components`, `routes`) and rules
blocking `core` from importing `adapters`, `components`, or SvelteKit-specific modules.
Unlike `eslint-plugin-import` (handles circular deps, not zone declarations) or
`no-restricted-imports` (verbose, fragile with `$lib` aliases), `eslint-plugin-boundaries`
supports pattern-based zone definitions that compose cleanly with SvelteKit's `$lib` alias.

**Key rule**: `core` zone → disallow imports from `adapters`, `components`, `routes`.

**Packages**: `eslint-plugin-boundaries`
