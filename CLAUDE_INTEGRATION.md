# CiteSkill: Claude Code integration

This document describes the Claude Code plugin in [`claude-plugin/`](claude-plugin/):
what it contains, how to install and test it, and how to publish it.

> **Verification markers.** Items tagged **[VERIFY]** are based on the locally
> installed Claude Code (2.1.282) and were not checked against current official
> documentation. Plugin and marketplace details change over time.

## 1. What the plugin does

The plugin teaches Claude Code to record direct agentic-source citations with the
CiteSkill CLI (`src/cli.ts`, `src/core.ts` are authoritative):

```sh
citeskill init
citeskill add --id <id> --kind <kind> --name <name> --ref-type commit|pr --ref <sha|number> [--url ...] [--provider ...] [--model ...] [--share 0..100] [--evidence-url ...]
citeskill validate --trailers
citeskill render --output README.md
citeskill commit-link --ids id1,id2
citeskill summary
```

- `init` creates `.citeskill/citations.json` (`schemaVersion: 1`, empty
  `entries`) and fails if it exists.
- `add` appends one entry. `--id`, `--kind`, `--name`, and `--ref-type` are
  required; `--ref` is required for PRs and defaults to `HEAD` for commits. Kinds:
  `agent`, `model`, `skill`, `plugin`, `app`, `mcp`, `project`. URLs must be
  HTTPS. `--share` is 0-100, allowed only for `agent` and `model`, and shares for
  the same work unit and kind must total 100 or less.
- `validate` checks the schema and that cited commits exist; `--trailers` also
  checks every `CiteSkill-Refs` ID in `git log --all` against the manifest.
- `render --output README.md` writes the citation section between
  `<!-- citeskill:start -->` and `<!-- citeskill:end -->`, or appends it.
- `commit-link` validates IDs and prints `CiteSkill-Refs: id1, id2`. It does not
  modify git.
- `summary` prints averaged model, provider, and agent shares as JSON.

`citeskill --help` prints a command summary. There is no per-command `--help` or `--commit` flag. Running the CLI with no
arguments prints a usage line and exits 1. Unknown flags are rejected.

Each manifest entry cites one work unit through `ref`:

```json
{
  "id": "claude-code-a1b2c3d",
  "kind": "agent",
  "name": "Claude Code",
  "ref": { "type": "commit", "value": "a1b2c3d" },
  "provider": "Anthropic"
}
```

The cited work commit can precede the citation record. The follow-up commit that
adds the manifest and README changes carries the trailer printed by `commit-link`.

The CLI is bundled at `scripts/cli.js` inside the plugin. Use `citeskill` if it is
on `PATH`; otherwise run `node "${CLAUDE_PLUGIN_ROOT}/scripts/cli.js"`. A built
checkout can also run `node <path-to-CiteSkill>/dist/cli.js`. The plugin does not
run hooks or write files on its own.

### Ground rules enforced by the skill

- Cite only sources that **directly** contributed to the cited commit or PR.
- **No exact-authorship claims.** `--share` is a user-declared estimate, recorded
  only when the user supplies it.
- **No transcript recording.** Transcripts, prompts, and tool outputs are never
  copied into the manifest or commits or uploaded. `--evidence-url` is set only from
  a URL the user provides.
- No guessed identifiers (model IDs, URLs, SHAs, PR numbers).
- A request to cite authorizes the CLI writes (`add`, `render --output`). Claude
  asks only when a source's involvement, an identifier, or a percentage is
  uncertain.
- No commits, pushes, or history rewrites unless the user asks.
- CLI errors override the plugin's documentation.

## 2. Layout

```
.claude-plugin/
└── marketplace.json         # root marketplace for GitHub install (source: "./claude-plugin")
claude-plugin/
├── .claude-plugin/
│   ├── plugin.json          # plugin manifest (name: citeskill)
│   └── marketplace.json     # local dev marketplace (source: "./")
├── commands/
│   ├── cite.md              # /citeskill:cite
│   └── cite-check.md        # /citeskill:cite-check (read-only)
├── skills/
│   └── cite-sources/
│       ├── SKILL.md         # model-invoked skill
│       └── reference/
│           ├── cli.md       # exact CLI commands and behavior
│           └── manifest.md  # manifest schema, kinds, example
└── README.md
```

Skills and commands are auto-discovered from the default `skills/` and `commands/`
directories, so `plugin.json` does not list them. Plugin commands are namespaced by
plugin name (e.g. `/citeskill:cite`). **[VERIFY]**

## 3. Installation

Prerequisites: Node.js 20+, git, and the CiteSkill CLI (see section 1).

### 3.1 Try it for one session (no install)

From the repository root:

```sh
claude --plugin-dir ./claude-plugin
```

### 3.2 Install from GitHub

The root [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) makes
this repository a marketplace named `citeskill` that points at `./claude-plugin`:

```sh
claude plugin marketplace add woulgar/CiteSkill
claude plugin install citeskill@citeskill
```

Or inside an interactive session:

```
/plugin marketplace add woulgar/CiteSkill
/plugin install citeskill@citeskill
```

To limit the checkout: `claude plugin marketplace add woulgar/CiteSkill --sparse .claude-plugin claude-plugin`.

### 3.3 Install from a local checkout

```sh
claude plugin marketplace add ./          # root marketplace
# or: claude plugin marketplace add ./claude-plugin   (plugin-local dev marketplace)
claude plugin install citeskill@citeskill
```

Both marketplaces are named `citeskill`; add only one of them. Restart Claude Code
if the plugin does not appear immediately.

### 3.4 Team setup (optional)

A project can pre-declare the marketplace and enable the plugin in
`.claude/settings.json` (`extraKnownMarketplaces` and `enabledPlugins`) so
teammates are prompted to install it when they trust the folder. **[VERIFY]** exact
keys and behavior.

## 4. Validation

```sh
# --strict treats warnings as errors (use in CI)
claude plugin validate ./.claude-plugin/marketplace.json --strict
claude plugin validate ./claude-plugin/.claude-plugin/plugin.json --strict
claude plugin validate ./claude-plugin/.claude-plugin/marketplace.json --strict
claude plugin validate ./claude-plugin/skills --strict
claude plugin validate ./claude-plugin/commands --strict
```

`claude plugin validate ./claude-plugin` (the directory) checks only
`marketplace.json` when both manifests are present, so validate `plugin.json`
explicitly.

Manual smoke test, in a scratch git repository with at least one commit:

1. `claude --plugin-dir <path-to-CiteSkill>/claude-plugin`.
2. Ask: "Cite the AI sources for the last commit." The `cite-sources` skill should
   trigger, run `citeskill init` if needed, and run `citeskill add ... --ref-type
   commit --ref <sha>` without asking for write confirmation. It should ask only
   about uncertain sources or percentages.
3. Check that `citeskill validate --trailers` passes, `README.md` gains the
   `citeskill:start`/`citeskill:end` block, and `citeskill commit-link` prints
   `CiteSkill-Refs: <ids>`. No commit is created unless requested.
4. Run `/citeskill:cite-check` and confirm it makes no changes.
5. Confirm no transcript text appears in `.citeskill/citations.json` or commits.

## 5. Publishing

### 5.1 Self-hosted marketplace

This repository is the marketplace (section 3.2). For a release:

1. Keep `version` in `claude-plugin/.claude-plugin/plugin.json` and both
   marketplace entries in sync. `claude plugin tag` can create a
   `citeskill--v<version>` git tag after checking that they agree.
2. Run the validation commands in section 4.
3. Tag a release.

### 5.2 Anthropic community marketplace

Submit this plugin through the [Claude directory management portal](https://claude.ai/directory/manage). Anthropic's [publishing guide](https://code.claude.com/docs/en/plugins/publish) says directory submission requires a GitHub repository containing the plugin and a paid claude.ai plan. Pro and Max users submit from their own account; Team and Enterprise submissions require an Owner or a member with directory permission. The separate `claude-plugins-official` marketplace has a partner route. Validate the plugin and follow the portal's additional checks. This package includes readable JavaScript for the local CLI, and it does not run hooks or MCP servers. The repository is public and ready for directory validation. The directory listing is not live until Anthropic's checks and publishing steps finish.

### 5.3 Pre-submission checklist

- [ ] `claude plugin validate --strict` passes for the plugin and both marketplaces.
- [ ] Smoke test in section 4 passes.
- [ ] Bundled CLI tested from an installed plugin.
- [ ] Version bumped and tagged.

## 6. Compatibility notes

- **Trailer format.** `commit-link` prints `CiteSkill-Refs: a, b`. The parser
  matches the key case-insensitively, trims spaces around commas, and reads only the
  last `CiteSkill-Refs` line of a message.
- **`validate --trailers` scope.** It scans every commit reachable from any ref
  (`git log --all`), not a range, and needs a repository with at least one commit.
- **Commit refs must exist.** `validate` fails for a `commit` entry whose SHA is not
  in the local repository, so cite committed work or use `--ref-type pr`.
- **Model identity.** The skill records `--model` only when it is known with
  certainty. Claude Code does not guarantee that the model ID is visible to the
  model in every configuration.
