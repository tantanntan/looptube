---
name: svelte-code-writer
description: CLI tools for Svelte 5 documentation lookup and code analysis. MUST be used whenever creating, editing or analyzing any Svelte component (.svelte) or Svelte module (.svelte.ts/.svelte.js). If possible, this skill should be executed within the svelte-file-editor agent for optimal results.
---

# Svelte 5 Code Writer

## CLI Tools

You have access to `@sveltejs/mcp` CLI for Svelte-specific assistance. This repository uses
Bun as the primary package manager, so prefer `bunx`:

### List Documentation Sections

```bash
bunx @sveltejs/mcp list-sections
```

Lists all available Svelte 5 and SvelteKit documentation sections with titles and paths.

### Get Documentation

```bash
bunx @sveltejs/mcp get-documentation "<section1>,<section2>,..."
```

Retrieves full documentation for specified sections. Use after `list-sections` to fetch relevant docs.

**Example:**

```bash
bunx @sveltejs/mcp get-documentation "$state,$derived,$effect"
```

### Svelte Autofixer

```bash
bunx @sveltejs/mcp svelte-autofixer "<code_or_path>" [options]
```

Analyzes Svelte code and suggests fixes for common issues.

**Options:**

- `--async` - Enable async Svelte mode (default: false)
- `--svelte-version` - Target version: 4 or 5 (default: 5)

**Examples:**

```bash
# Analyze inline code (escape $ as \$)
bunx @sveltejs/mcp svelte-autofixer '<script>let count = \$state(0);</script>'

# Analyze a file
bunx @sveltejs/mcp svelte-autofixer ./src/lib/Component.svelte

# Target Svelte 4
bunx @sveltejs/mcp svelte-autofixer ./Component.svelte --svelte-version 4
```

**Important:** When passing code with runes (`$state`, `$derived`, etc.) via the terminal, escape the `$` character as `\$` to prevent shell variable substitution.

## Workflow

1. **Uncertain about syntax?** Run `list-sections` then `get-documentation` for relevant topics
2. **Reviewing/debugging?** Run `svelte-autofixer` on the code to detect issues
3. **Always validate** - Run `svelte-autofixer` before finalizing any Svelte component

## LoopTube Repository Requirements

- Every `.svelte` component file MUST include a `<style></style>` block, even when empty.
- User-facing strings MUST be externalized to `src/lib/i18n/en.json` and
  `src/lib/i18n/ja.json` and accessed through `createTranslator`, unless explicitly
  exempted as a brand/token string.
- Validate changed Svelte/type code with `bun run check` and relevant unit tests
  (`bun run test:unit` or targeted `bunx vitest run <file>`).
