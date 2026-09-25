---
name: cite-work
description: Record direct agent, model, skill, plugin, app, MCP, and source-project citations for repository work using CiteSkill. Use when a user asks to cite AI-assisted work, attribute sources, or update the project's CiteSkill record.
---

# Cite repository work

Use the repository's `citeskill` CLI. If it is unavailable, explain how to install it from the CiteSkill repository; do not invent citation records.

1. Identify sources actually used for the current commit or PR. Ask the user to confirm uncertain sources and any estimated work-share percentages. Never infer percentages from token counts or claim measured authorship.
2. Run `citeskill init` only if `.citeskill/citations.json` is absent. Add one entry per direct source with `citeskill add --id <slug> --kind <agent|model|skill|plugin|app|mcp|project> --name <name> --ref-type <commit|pr> --ref <sha|number>`. Add `--url`, `--provider`, `--model`, `--share`, or `--evidence-url` only when known and safe to publish.
3. For a new commit, create the commit first, then record citations against its SHA in a later citation commit. For a PR, record its number once known. Include `CiteSkill-Refs: <ids>` in the relevant commit message when possible; `citeskill commit-link --ids <ids>` prints a validated trailer.
4. Run `citeskill validate --trailers` and `citeskill render --output README.md`. Review the diff before committing.

Do not put prompts, conversation transcripts, secrets, or private links in citations. Cite a source project only when it was used directly; do not copy its own dependency citations.
