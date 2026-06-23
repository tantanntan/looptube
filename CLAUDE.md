<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/003-implement-looptube-ui/plan.md
<!-- SPECKIT END -->

## Svelte MCP Tools

You have access to the Svelte MCP server (`sveltejs/ai-tools`). Follow these rules when writing Svelte code:

1. **Always call `list-sections` first** to discover available Svelte 5 / SvelteKit documentation sections before working on any Svelte topic.
2. **After `list-sections`, call `get-documentation`** for ALL sections relevant to the task (use the `use_cases` field to judge relevance).
3. **Always run `svelte-autofixer`** on any Svelte code before sending it to the user. Keep calling it until no issues or suggestions remain.
4. **Offer `playground-link`** after completing code — but only after explicit user confirmation, and never when the code has already been written to project files.
