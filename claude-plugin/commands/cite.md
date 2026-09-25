---
description: Record direct agentic-source citations for the current work with the CiteSkill CLI
argument-hint: "[optional notes, e.g. 'cite PR 42' or 'also used an MCP search server']"
---

Use the `cite-sources` skill from this plugin to cite the direct sources for the
current work in this repository. This command authorizes the CLI writes below; do
not ask for confirmation before each one.

User notes: $ARGUMENTS

Steps:

1. Locate the CLI: `citeskill` on `PATH`, or `node <path-to-CiteSkill>/dist/cli.js`.
   If neither is available, ask the user for the path or stop.
2. If `.citeskill/citations.json` does not exist, run `citeskill init`.
3. Determine the work reference: a commit SHA (usually `HEAD`) or a PR number from
   the user's notes. If the work is uncommitted and no PR number is given, say that
   a commit or PR is needed and stop.
4. Determine the sources that directly contributed to this work, plus any the user
   named. Ask only if a source's involvement, an identifier, or a share percentage
   is uncertain. Do not add `--share` or `--evidence-url` unless the user supplied
   them. Do not read, copy, or upload transcripts.
5. Run `citeskill add --id <id> --kind <kind> --name <name> --ref-type commit|pr --ref <sha|number>`
   (with `--url`, `--provider`, `--model` when known) for each source.
6. Run `citeskill validate --trailers`, then `citeskill render --output README.md`.
7. Run `citeskill commit-link --ids <id1>,<id2>` and report the IDs, validation
   result, and the printed trailer line. Do not create a commit unless the user
   asked for one.
