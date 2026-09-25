# CiteSkill CLI reference

Source of truth: `src/cli.ts` and `src/core.ts` in the CiteSkill repository. Run
every command from the root of the repository being cited.

Invocation: `citeskill` if it is on `PATH`, otherwise
`node <path-to-CiteSkill>/dist/cli.js` after `npm install && npm run build` in the
CiteSkill checkout. Requires Node.js 20+ and git.

`citeskill --help` prints a command summary. Running with no arguments or an unknown command prints
`Usage: citeskill <init|add|validate|render|commit-link|summary> [options]` and exits
with status 1. Errors are printed to stderr with exit status 1.

## Commands

| Command | Behavior |
|---------|----------|
| `citeskill init` | Creates `.citeskill/citations.json` with `schemaVersion: 1` and empty `entries`. Fails if it already exists. |
| `citeskill add --id <id> --kind <kind> --name <name> --ref-type commit\|pr --ref <sha\|number> [--url ...] [--provider ...] [--model ...] [--share 0..100] [--evidence-url ...]` | Appends one entry, validates the whole manifest, saves it, and prints `Added <id>`. |
| `citeskill validate` | Validates the manifest and checks that every `commit` reference exists in git. Prints `Valid: N citation(s).` |
| `citeskill validate --trailers` | Also scans every commit message in `git log --all` and fails on any `CiteSkill-Refs` ID not in the manifest. |
| `citeskill render` | Prints the generated Markdown citation section to stdout. |
| `citeskill render --output README.md` | Writes the section into the file between `<!-- citeskill:start -->` and `<!-- citeskill:end -->`, or appends it if the markers are absent. Fails if the markers are broken. |
| `citeskill commit-link --ids id1,id2` | Checks the IDs exist and prints `CiteSkill-Refs: id1, id2`. Does not modify git. |
| `citeskill summary` | Prints `{ model, provider, agent, workUnits }` share averages as JSON. |

## `add` flags

| Flag | Required | Manifest field | Rules |
|------|----------|----------------|-------|
| `--id` | yes | `id` | Unique lowercase slug matching `^[a-z0-9][a-z0-9-]{1,63}$`. |
| `--kind` | yes | `kind` | `agent`, `model`, `skill`, `plugin`, `app`, `mcp`, or `project`. |
| `--name` | yes | `name` | Nonempty, single line. |
| `--ref-type` | yes | `ref.type` | `commit` or `pr`. |
| `--ref` | for `pr` | `ref.value` | Commit SHA (7-40 hex chars) or PR number (digits). For `commit`, defaults to the current `HEAD` SHA when omitted. |
| `--url` | no | `url` | `https://` URL. |
| `--provider` | no | `provider` | Nonempty, single line. |
| `--model` | no | `model` | Nonempty, single line. Exact model ID only when known. |
| `--share` | no | `estimatedShare` | Number 0-100; only for `agent` and `model` kinds. Shares with the same `ref` and `kind` must total 100 or less. |
| `--evidence-url` | no | `evidenceUrl` | `https://` URL the user chose to share. |

Option parsing: every flag takes exactly one value (`--flag value`), and a value may
not start with `--`. Unknown flags are rejected, so check spelling.

## Examples

```sh
citeskill init
citeskill add --id claude-code-a1b2c3d --kind agent --name "Claude Code" --provider Anthropic --ref-type commit --ref a1b2c3d
citeskill add --id source-project-42 --kind project --name "Source project" --url https://github.com/example/source --ref-type pr --ref 42
citeskill validate --trailers
citeskill render --output README.md
citeskill commit-link --ids claude-code-a1b2c3d,source-project-42
citeskill summary
```

## Git trailer

```
CiteSkill-Refs: claude-code-a1b2c3d, source-project-42
```

- Key `CiteSkill-Refs` (matched case-insensitively); value is a comma-separated list
  of manifest IDs. Spaces around commas are allowed.
- If a message contains several `CiteSkill-Refs` lines, only the last one is read.
- Put it in the final trailer paragraph of the commit that records the citations.
  With git 2.32+: `git commit --trailer "CiteSkill-Refs: a, b"`.
- Inspect: `git log -1 --format='%(trailers:key=CiteSkill-Refs,valueonly)'`.

The cited work commit can precede the citation record; the trailer goes in the
follow-up commit. Do not amend, rebase, or force-push existing commits to add
trailers unless the user explicitly asks for that history rewrite.
