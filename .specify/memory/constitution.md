<!-- SYNC_IMPACT_REPORT
Version change: 1.1.0 → 2.0.0
Modified principles:
  - Tech Stack: package manager changed from npm/pnpm to Bun to match package.json and current repository scripts
  - V. StoragePort Abstraction → Persistence Port Abstractions: clarified that domain-specific persistence ports are allowed when responsibilities differ, while preserving port/adapter and DI requirements
  - VI. Dependency Injection: expanded persistence boundary wording to cover domain-specific persistence ports
Added sections:
  - Spec Kit Artifact Consistency expectations propagated to templates/skills
Removed sections: None
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — added artifact consistency and constitution-sensitive boundary checks
  ✅ .specify/templates/spec-template.md — added data contract consistency guard
  ✅ .specify/templates/tasks-template.md — added constitution-driven TDD and cross-artifact validation
  ✅ .specify/templates/checklist-template.md — added cross-artifact consistency checklist examples
  ✅ .specify/workflows/speckit/workflow.yml — added analyze gate before implementation
  ✅ .specify/workflows/workflow-registry.json — updated workflow metadata
  ✅ .claude/skills/speckit-*.md — added generation/analysis/implementation preflight rules
  ✅ .claude/agents/svelte-file-editor.md and Svelte skills — added repo-specific Svelte/i18n/style validation rules
  ✅ CLAUDE.md — added Spec Kit artifact discipline and command lockstep rules
Deferred TODOs: None
-->

# LoopTube Constitution

## Tech Stack

The following technology choices are **non-negotiable** for this project:

| Layer | Choice |
|---|---|
| Frontend + Backend | SvelteKit (App Router, `+server.ts` API routes, Server Actions) |
| Language | TypeScript — mandatory across all layers, strict mode |
| Unit / Integration testing | Vitest (Node environment) |
| E2E testing | Playwright |
| Package manager | Bun (`package.json#packageManager`) |

No alternative frameworks, runtimes, languages, or primary package managers may be
introduced without amending this constitution. TypeScript `strict` mode MUST be enabled in
`tsconfig.json`. Existing npm-compatible scripts MUST be run through Bun by default; pnpm
may be used only when a documented repository command requires it, and then with the
project-specific PATH prefix recorded in `CLAUDE.md`.

## Design Principles

The following product-level principles constrain all UI and feature decisions:

- **Mobile-first**: All UI MUST be designed and tested for mobile viewports first.
  Desktop layouts are progressive enhancements.
- **i18n-ready**: All user-facing strings MUST be externalised into locale files
  from day one. Japanese (ja) and English (en) are the two supported locales.
- **YouTube IFrame Player API is the only permitted playback method**: No alternative
  video player SDKs, `<video>` element hacks, or third-party wrappers may be used.
  The IFrame API MUST be accessed exclusively through the `VideoPlayerPort` abstraction
  defined in Principle III.

## Core Principles

### I. Test-Driven Development (TDD)

All feature development MUST follow the Red-Green-Refactor cycle:

- Write a failing test that captures the intended behavior **before** writing any
  implementation code.
- Implement the minimum code required to make the test pass.
- Refactor to improve clarity and structure while keeping all tests green.

No implementation code may be written without a corresponding failing test committed first.
This constraint applies to all layers: domain logic, port adapters, SvelteKit routes, and
Svelte UI components.

### II. Harness Engineering

Every module MUST be independently testable in isolation—without a running browser,
YouTube IFrame API, database, or network connection.

Harness Engineering is a first-class engineering concern, not an afterthought. When a module
cannot be tested in isolation, that is a design defect that MUST be remedied before the
feature is considered complete.

### III. VideoPlayerPort Abstraction (NON-NEGOTIABLE)

All interactions with the YouTube IFrame Player API MUST be routed through a
`VideoPlayerPort` interface (or equivalent named abstraction boundary).

- Test environments MUST inject a `FakeVideoPlayer` (or stub) that satisfies `VideoPlayerPort`.
- Production environments MUST inject the real `YouTubePlayerAdapter`.
- No business-logic module may import or reference the YouTube IFrame Player API SDK directly.

Violation of this boundary is a build-blocking defect with no exceptions.

### IV. Pure Domain Logic

The A-B loop state machine (`ABLoopStateMachine`), polling logic, seek logic, and all
related domain algorithms MUST live in pure, framework-agnostic TypeScript modules with the
following hard constraints:

- No DOM API usage (`document`, `window`, `HTMLElement`, or any browser global).
- No Svelte stores, components, lifecycle hooks, or context dependencies.
- No SvelteKit-specific APIs (`page`, `goto`, `invalidate`, etc.).
- No direct imports of browser-only globals or environment-specific APIs.

These modules MUST be fully unit-testable with Vitest in a standard Node.js environment
without jsdom, happy-dom, or any browser runtime.

### V. Persistence Port Abstractions

All persistence access MUST be routed through an explicit port interface defined under
`src/lib/ports/`. The existing `StoragePort` is the canonical persistence boundary for
saved A-B loop segments. Additional domain-specific persistence ports MAY be introduced
when the data lifecycle, identity, or operations are materially different from segment
persistence.

Every persistence port, including `StoragePort` and any domain-specific alternatives,
MUST satisfy the same boundary rules:

- The interface lives in `src/lib/ports/`.
- Production adapters live in `src/lib/adapters/`.
- Test environments inject an in-memory fake from `src/lib/fakes/`.
- Business-logic modules MUST NOT reference `window.localStorage`, any database client,
  or any SvelteKit server utility directly.
- The port interface MUST be location-agnostic: it MUST NOT expose whether storage is
  local or remote.
- The feature plan/data model MUST document why an existing persistence port is not being
  reused and must define one authoritative method contract for the new port.

For segment persistence, the current production implementations remain:

- **`DatabaseStorageAdapter`**: Used for authenticated users; persists segments
  server-side via SvelteKit API routes.
- **`LocalStorageAdapter`**: Used for unauthenticated users; persists segments
  client-side in `localStorage`.

### VI. Dependency Injection

All side-effectful boundaries MUST be passed as explicit constructor or function-parameter
dependencies—never imported directly inside business logic modules. The four named port
boundaries are:

| Port | Replaces |
|---|---|
| `VideoPlayerPort` | YouTube IFrame Player API |
| `StoragePort` and domain-specific persistence ports | Database (SvelteKit server) + `localStorage` fallback |
| `TimerPort` | `setInterval`, `clearInterval`, `setTimeout` |
| `RouterPort` | SvelteKit `goto`, `page` store, URL search params |

The dependency graph MUST flow inward: domain logic ← port adapters ← framework layer.
Dependency injection is the **only** permitted mechanism for connecting domain logic to
platform capabilities.

### VII. Test Runner & CI Enforcement

- **Unit and integration tests**: Vitest (Node environment; no browser required).
- **End-to-end tests**: Playwright.

CI MUST enforce execution in this strict sequential order:

1. Unit tests
2. Integration tests
3. E2E tests

A CI stage MUST NOT advance if any preceding stage contains failures. Flaky tests MUST be
fixed or explicitly quarantined with a tracked issue; they MUST NOT be silently skipped.

### VIII. Coverage Gate

A feature is NOT considered implemented until both conditions are met:

1. All tests in the feature's test suite pass with zero failures.
2. Code coverage of core loop logic reaches **100%**. Core loop logic is defined as:
   - `ABLoopStateMachine` — all state transitions and guard conditions
   - `SegmentRepository` — read, write, delete operations via `StoragePort`
   - URL serialization and deserialization of loop parameters

Coverage MUST be measured by Vitest's built-in coverage reporter (`@vitest/coverage-v8` or
equivalent). CI MUST fail and block merge if this gate is not met.

## API & Data Persistence

- SvelteKit `+server.ts` routes serve as the sole backend API layer.
- Segment data is persisted **server-side in a database** for authenticated users,
  and **client-side in `localStorage`** for unauthenticated users.
- Authentication MUST be implemented via OAuth. Google OAuth is the recommended
  primary provider.
- All `+server.ts` API endpoint handlers MUST have integration tests that run against
  a **real test database**. Mocking the database layer in integration tests is prohibited.
- The test database MUST be provisioned in CI via a Docker container or equivalent
  disposable mechanism.

## Boundary Contracts

All port interfaces (`VideoPlayerPort`, `StoragePort`, domain-specific persistence ports,
`TimerPort`, `RouterPort`) MUST be defined in a dedicated `src/lib/ports/` directory and
treated as the public API contract of the domain layer. Adapter implementations MUST
reside in `src/lib/adapters/`.

**Dependency boundary (enforced by ESLint import rules)**:

```
┌──────────────────────────────────────────────────────┐
│          UI Layer (Svelte components, +page.svelte)  │
└───────────────────────┬──────────────────────────────┘
                        │ injects ports
┌───────────────────────▼──────────────────────────────┐
│            Application Core (pure TypeScript)        │
│   ABLoopStateMachine / SegmentRepository / other     │
│   pure repositories                                  │
│   ← no DOM, no Svelte, no YouTube SDK, no DB client  │
└──────────┬─────────────────────────┬─────────────────┘
           │ VideoPlayerPort         │ Persistence ports / TimerPort / RouterPort
    [YouTubePlayerAdapter]    [Database/Local adapters per port]
    [FakeVideoPlayer (test)]  [In-memory fakes per port]
```

Any change to a port interface is a **breaking change** and MUST:

1. Be documented in the project changelog.
2. Trigger corresponding updates to all adapter implementations and their tests.
3. Increment at minimum the MINOR version of the affected module (MAJOR if it removes
   or renames an existing method).

## Quality Gates

The following gates MUST all pass before any feature branch can be merged to `main`:

| Gate | Tool | Threshold |
|---|---|---|
| Unit tests | Vitest | 100% pass |
| Integration tests | Vitest (real test DB) | 100% pass |
| E2E tests | Playwright | 100% pass |
| Core loop coverage | Vitest coverage | 100% |
| TypeScript compilation | `tsc --noEmit` | 0 errors |
| Lint + import boundary check | ESLint | 0 errors |

## Governance

This constitution supersedes all other development practices and guidelines for this project.
When any conflict arises between this document and any other guideline, this constitution
takes precedence.

**Amendment procedure**:

1. Propose the amendment as a pull request targeting `main`, modifying this file.
2. The PR description MUST include a rationale explaining why the current principle is
   insufficient or incorrect.
3. Any amendment that weakens a testing or abstraction requirement MUST include explicit
   justification and sign-off from the project maintainer.
4. Upon merge, update `LAST_AMENDED_DATE` and increment `CONSTITUTION_VERSION`
   per the versioning policy below.

**Versioning policy** (semantic versioning):

- MAJOR: A principle is removed or a non-negotiable constraint is relaxed.
- MINOR: A new principle or section is added, or existing guidance is materially expanded.
- PATCH: Clarifications, wording improvements, typo corrections, or non-semantic refinements.

**Compliance review**: Every PR description MUST include a "Constitution Check" section
confirming that no principles are violated, or explicitly documenting any approved temporary
deviation (with a linked tracking issue for resolution).

**Runtime guidance**: For day-to-day development workflow and agent-specific instructions,
refer to `CLAUDE.md`.

**Version**: 2.0.0 | **Ratified**: 2026-06-22 | **Last Amended**: 2026-06-24
