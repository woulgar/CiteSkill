# CiteSkill

CiteSkill records the agents, models, skills, plugins, apps, MCP servers, and source projects used directly in a repository. Its citations live beside the code and can be linked to Git commits or pull requests. Contribution percentages are **user-declared estimates**, not measured authorship.

## Install and use

Requires Node.js 20 or later. During the private beta, clone this repository and run `npm install && npm run build`. From a project that should contain citations, run `node <path-to-CiteSkill>/dist/cli.js` with the commands below. After the public release, the package can be installed normally when distribution is available.

```sh
citeskill init
citeskill add --id astra-feature-1 --kind model --name Astra --provider OpenAI --model Astra --share 40 --ref-type commit --ref <commit-sha>
citeskill add --id source-project-1 --kind project --name "Source project" --url https://github.com/example/source --ref-type commit --ref <commit-sha>
citeskill validate --trailers
citeskill render --output README.md
citeskill summary
```

Use `citeskill commit-link --ids astra-feature-1,source-project-1` to print a validated Git trailer:

```text
CiteSkill-Refs: astra-feature-1, source-project-1
```

The cited work commit can precede the citation record. Put the citation in a follow-up commit and include the trailer there. A pull-request citation uses `--ref-type pr --ref <number>`.

## Format and percentages

The canonical record is `.citeskill/citations.json`, currently `schemaVersion: 1`. Each entry has a unique ID, source kind, name, and commit SHA or PR number. Optional fields include a canonical HTTPS URL, provider, model, estimated share, and safe evidence URL. The CLI validates required fields, ranges, source kinds, and per-work-unit share totals. Model, provider, and agent totals are displayed separately. Each referenced commit or PR with declared shares counts as one work unit in the project average; unallocated share remains unknown.

The README section and badge are generated from this record. GitHub's native Contributors panel is unaffected. CiteSkill records direct usage only: a downstream project cites a source project, without copying that project's own citations. No prompt or transcript is required or stored.

## Integrations

The Codex plugin is in [`plugins/citeskill`](plugins/citeskill). The Claude integration is in [`claude-plugin`](claude-plugin). Both guide the same CLI workflow; the manifest is the shared contract.

## Attribution convention and license

When CiteSkill helps document a project, consider keeping the generated citations visible and crediting the direct sources you used. Teams can require this through their own repository policies and CI. CiteSkill itself is MIT licensed; use of this tool or a cited skill does not automatically impose a new legal obligation on downstream projects.

Support development through [GitHub Sponsors](https://github.com/sponsors/woulgar) or [Buy Me a Coffee](https://www.buymeacoffee.com/woulgar).

<!-- citeskill:start -->
## Agentic citations

![CiteSkill](https://img.shields.io/badge/attribution-CiteSkill-blue)

Contribution shares below are user-declared estimates averaged across cited commits and PRs. They are not measured authorship.

**Models:** Not declared

**Providers:** Not declared

**Agents:** Not declared

| Kind | Source | Work |
| --- | --- | --- |
| agent | Codex | commit b3b8902022180a9be858c5eb5f998ff1dbf0e3f4 |
| model | Claude-Opus-5.5 | commit b3b8902022180a9be858c5eb5f998ff1dbf0e3f4 |
| skill | plugin-creator | commit b3b8902022180a9be858c5eb5f998ff1dbf0e3f4 |
| skill | skill-creator | commit b3b8902022180a9be858c5eb5f998ff1dbf0e3f4 |

<!-- citeskill:end -->
