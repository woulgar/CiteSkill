# CiteSkill plugin for Claude Code

Guides Claude Code to record **direct agentic-source citations** (agents, models,
skills, plugins, apps, MCP servers, source projects) in
`.citeskill/citations.json`, render them into `README.md`, and link them to commits
with a `CiteSkill-Refs:` git trailer, using the `citeskill` CLI.

## Contents

| Path | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin manifest (`citeskill`). |
| `.claude-plugin/marketplace.json` | Local development marketplace that lists this plugin. |
| `skills/cite-sources/SKILL.md` | Model-invoked skill with the citation workflow and ground rules. |
| `skills/cite-sources/reference/` | Manifest schema and CLI reference. |
| `commands/cite.md` | `/citeskill:cite` — record citations for the current work. |
| `commands/cite-check.md` | `/citeskill:cite-check` — read-only validation of manifest and trailers. |

## Requirements

- Claude Code with plugin support.
- Node.js 20+ and git. The CLI is bundled at `scripts/cli.js`; run it with
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/cli.js"` when `citeskill` is not on `PATH`.
- git (2.32+ for `git commit --trailer`).

## Quick start

```sh
# Try the plugin for one session without installing it
claude --plugin-dir ./claude-plugin

# Or install from GitHub
claude plugin marketplace add woulgar/CiteSkill
claude plugin install citeskill@citeskill
```

Then ask, for example, "cite the AI sources for this commit", or run
`/citeskill:cite`.

The workflow the plugin follows:

```sh
citeskill init
citeskill add --id <id> --kind <kind> --name <name> --ref-type commit|pr --ref <sha|number>
citeskill validate --trailers
citeskill render --output README.md
citeskill commit-link --ids id1,id2
citeskill summary
```

See [`../CLAUDE_INTEGRATION.md`](../CLAUDE_INTEGRATION.md) for installation,
validation, and marketplace guidance.

## Principles

- Cite only sources that directly contributed to the cited commit or PR.
- Shares (`--share`, 0-100) are user-declared estimates, never invented, and not
  authorship claims.
- Never record or upload transcripts; `--evidence-url` only when the user provides it.
- Asking to cite authorizes the CLI writes; Claude asks only about uncertain sources,
  identifiers, or percentages.
- No commits or pushes unless the user asks.
