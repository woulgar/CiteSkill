---
name: cite-sources
description: Record direct agentic-source citations (agents, models, skills, plugins, apps, MCP servers, source projects) for work in this repository using the CiteSkill CLI, and link them to commits with a `CiteSkill-Refs` git trailer. Use when the user asks to cite, credit, attribute, or disclose AI/agent contributions, mentions `.citeskill/citations.json` or `citeskill`, or is preparing a commit or PR and wants AI assistance recorded.
---

# CiteSkill: cite direct agentic sources

CiteSkill records **which sources directly contributed** to a commit or pull
request in a reviewable manifest at `.citeskill/citations.json`, and links those
entries to later commits with a `CiteSkill-Refs:` trailer. All manifest writes go
through the `citeskill` CLI; this skill guides you in using it correctly.

When the user asks you to cite sources, that request authorizes running the CLI
commands below (including `citeskill add` and `citeskill render --output`). Do not
ask for a separate confirmation before each write.

## Ground rules (always apply)

1. **Direct sources only.** Cite an agent, model, skill, plugin, app, MCP server, or
   source project only if it directly produced or materially shaped the cited work.
   Do not cite things that were merely installed, available, or used for unrelated
   tasks. If you are unsure whether a source qualifies, ask the user.
2. **No exact-authorship claims.** `--share` is a user-declared estimate, not
   measured authorship. Never invent a share. Pass `--share` only when the user
   supplied the value; if the user wants percentages but gave none, ask for them.
3. **No transcript recording.** Never copy conversation transcripts, prompts, tool
   outputs, or private session content into the manifest, commit messages, or any
   file, and never upload them. Pass `--evidence-url` only when the user provides a
   URL they chose to share.
4. **Do not guess identifiers.** Pass `--model` only if the exact model ID is known
   (for example, stated in your system context or by the user). Do not fabricate
   URLs, provider names, commit SHAs, or PR numbers; ask when one is needed and
   unknown.
5. **No commits or pushes unless requested.** Creating the manifest and README
   section is part of citing; creating commits, pushing, or rewriting history is not.
6. **The CLI is canonical.** If this guidance and CLI errors disagree, follow the
   CLI and tell the user about the mismatch.

## Invoking the CLI

Use `citeskill` if it is on `PATH`. Otherwise use the CLI bundled with this plugin:
`node "${CLAUDE_PLUGIN_ROOT}/scripts/cli.js"`. If the plugin root is unavailable,
use `node <path-to-CiteSkill>/dist/cli.js` from a built checkout. Run all commands
from the root of the repository being cited.

`citeskill --help` prints a command summary; there is no per-command `--help`. Running the CLI with no arguments or an unknown
command prints a one-line usage message and exits with status 1. See
[reference/cli.md](reference/cli.md) for exact flags and behavior.

## Workflow

### 1. Initialize (once per repository)

If `.citeskill/citations.json` does not exist:

```sh
citeskill init
```

This creates `{"schemaVersion": 1, "entries": []}`. It fails if the file exists.

### 2. Decide what to cite and the work reference

Collect candidates from what actually happened in the cited work:

- The agent you are running as (for example, Claude Code, `--kind agent`) and the
  model (`--kind model`), if known.
- Skills, plugins, apps, or MCP servers whose output directly shaped the work.
- Source projects the work directly copied from or built on (`--kind project`).
- Other AI tools the **user** tells you they used for this work.

Each entry cites exactly one work unit: a commit (`--ref-type commit --ref <sha>`)
or a pull request (`--ref-type pr --ref <number>`). A commit must already exist, so
cite work that has been committed (usually `HEAD`) or a PR number. If the work is not
committed yet and the user has not asked you to commit it, tell them the citation
needs a commit SHA or PR number.

### 3. Record entries

Run one `citeskill add` per source. `--id`, `--kind`, `--name`, and `--ref-type`
are required; `--ref` is required for PRs and defaults to the current `HEAD` SHA for
commits (prefer passing it explicitly).

```sh
citeskill add --id claude-code-a1b2c3d --kind agent --name "Claude Code" --provider Anthropic --url https://claude.com/claude-code --ref-type commit --ref a1b2c3d
citeskill add --id opus-a1b2c3d --kind model --name "Claude Opus" --provider Anthropic --model <exact-model-id> --ref-type commit --ref a1b2c3d
```

- IDs are unique lowercase slugs (`a-z0-9-`, 2-64 characters). Because every entry
  is tied to one work unit, create new entries for new work; include a short SHA or
  PR number in the ID to keep IDs unique.
- `--kind` is one of `agent`, `model`, `skill`, `plugin`, `app`, `mcp`, `project`.
- `--url` and `--evidence-url` must be `https://` URLs.
- `--share` (0-100) is only valid for `agent` and `model` entries; shares for the
  same work unit and kind must not exceed 100 in total.
- Misspelled flags are rejected; check the CLI error and correct the flag.

See [reference/manifest.md](reference/manifest.md) for the resulting fields.

### 4. Validate

```sh
citeskill validate --trailers
```

This checks the manifest schema, that every cited commit exists, and (with
`--trailers`) that every `CiteSkill-Refs` ID in all reachable commits exists in the
manifest. Fix reported problems before continuing, through the CLI where possible.
Tell the user if you edit the manifest by hand.

### 5. Render and summarize

```sh
citeskill render --output README.md
citeskill summary
```

`render --output` replaces the block between `<!-- citeskill:start -->` and
`<!-- citeskill:end -->` in `README.md`, or appends it if absent. `summary` prints
averaged model, provider, and agent shares as JSON.

### 6. Link to a commit

```sh
citeskill commit-link --ids claude-code-a1b2c3d,opus-a1b2c3d
```

This only prints a validated trailer line, for example
`CiteSkill-Refs: claude-code-a1b2c3d, opus-a1b2c3d`; it does not touch git. Use the
line verbatim in the commit that records the citations (a follow-up commit
containing `.citeskill/citations.json` and the README change). Place it in the final
trailer paragraph, with any other trailers such as `Co-Authored-By:`. Create that
commit only if the user asked you to commit.

## What to tell the user

Briefly report: the entry IDs added, whether validation passed, whether `README.md`
was updated, and the trailer line to use. Mention that any shares are user-declared
estimates, not authorship claims.

## References

- [reference/manifest.md](reference/manifest.md) — manifest fields, kinds, example.
- [reference/cli.md](reference/cli.md) — exact CLI commands and behavior.
