---
name: cite-work
description: Record direct agent, model, skill, plugin, app, MCP, and source-project citations for repository work using CiteSkill. Use when a user asks to cite AI-assisted work, attribute sources, or update the project's CiteSkill record.
---

# Cite repository work

When a local repository shell is available, use `citeskill` if installed. Otherwise locate this skill's plugin root and run `node <plugin-root>/scripts/cli.js` from the target repository. The plugin includes a compiled CLI. If no repository shell is available, help the user prepare a schema v1 citation entry from facts they provide; state that Git references and trailers have not been verified. Do not invent citation records.

The minimum entry is `{ "id": "lowercase-slug", "kind": "model", "name": "Source name", "ref": { "type": "commit", "value": "full-or-short-sha" } }`. A full manifest has `{ "schemaVersion": 1, "entries": [...] }`. Use a PR number with `type: "pr"` when appropriate.

1. Identify sources actually used for the current commit or PR. Ask the user to confirm uncertain sources and any estimated work-share percentages. Never infer percentages from token counts or claim measured authorship.
2. Run `citeskill init` only if `.citeskill/citations.json` is absent. Add one entry per direct source with `citeskill add --id <slug> --kind <agent|model|skill|plugin|app|mcp|project> --name <name> --ref-type <commit|pr> --ref <sha|number>`. Add `--url`, `--provider`, `--model`, `--share`, or `--evidence-url` only when known and safe to publish.
3. For a new commit, create the commit first, then record citations against its SHA in a later citation commit. For a PR, record its number once known. Include `CiteSkill-Refs: <ids>` in the relevant commit message when possible; `citeskill commit-link --ids <ids>` prints a validated trailer.
4. Run `citeskill validate --trailers` and `citeskill render --output README.md`. Review the diff before committing.

Do not put prompts, conversation transcripts, secrets, or private links in citations. Cite a source project only when it was used directly; do not copy its own dependency citations.
