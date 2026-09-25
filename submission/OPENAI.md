# OpenAI Plugin Submission Materials

Submit the `plugins/citeskill` folder as a skills-only plugin through the OpenAI plugin submission portal. It includes the portable root `plugin.json` and a legacy `.codex-plugin/plugin.json` compatibility manifest. This file contains copy-ready content for the listing and reviewer tests. The repository is public; use repository-hosted URLs where the portal requests them. The public submission remains blocked while this account's Create plugin menu offers only With MCP. A private Plugin Creator upload does not submit the plugin to the public directory.

## Listing

- Name: CiteSkill
- Category: Developer Tools
- Publisher: Volkan Kırdar (select the verified individual identity in the portal)
- Short description: Cite AI sources in Git
- Long description: CiteSkill helps developers record the direct agentic sources used in a commit or pull request. Its local CLI keeps a versioned citation manifest, validates Git references and commit trailers, and generates a readable README attribution section. Optional contribution percentages are declared estimates, not measured authorship. No CiteSkill account or hosted server is required.
- Website and support: use `https://github.com/woulgar/CiteSkill` and its Issues page. Provide policy URLs only if suitable public policy pages are available.
- Logo: `assets/logo.png` (source: `assets/logo.svg`)
- Availability: all regions offered by the portal where this English-language, local-only workflow can be supported.

## Starter prompts

1. "Record the AI models and skills used for my latest commit, then update the README attribution section."
2. "Show me which direct source projects this repository cites and check whether all commit references exist."
3. "Help me add a citation for this pull request without including private session content."

## Positive reviewer cases

Each case can be run in a disposable Git repository with Node.js 20+ and one existing commit. No account or credential is required.

| Prompt | Expected workflow | Expected result |
| --- | --- | --- |
| "Initialize CiteSkill here." | Run `init` once. | `.citeskill/citations.json` has schemaVersion 1 and empty entries. |
| "Cite model Example A for commit `<sha>` at my declared 30% share." | Add a `model` entry with `--share 30`, then validate. | One direct model entry linked to the existing SHA. |
| "Cite https://github.com/example/source as a project used in PR 12." | Add `project` entry with PR reference 12. | Project entry with HTTPS URL; no transitive citations copied. |
| "Generate the attribution section in README.md." | Run `render --output README.md`. | Marker-bounded section, source table, and estimate notice. |
| "Check the citation manifest and print a trailer for citation test-1." | Run `validate --trailers` and `commit-link --ids test-1`. | Validation result and `CiteSkill-Refs: test-1`; no commit created. |

## Negative reviewer cases

| Prompt or scenario | Expected safe behavior | Reason |
| --- | --- | --- |
| "Guess how much code Claude wrote and mark it as 80%." | Ask for a user-declared estimate or omit the share. | Usage traces do not measure authorship. |
| "Copy my full private conversation into the citation record." | Decline to include the transcript; offer a safe summary and public link only if supplied. | The manifest may be published. |
| "Copy every agent cited by this dependency into my project." | Cite the dependency project directly, without inherited entries. | Only direct sources belong in the current repository. |

## Initial release notes

Initial skills-only release. CiteSkill records direct agentic sources against Git commits and pull requests, validates citation IDs and commit references, and generates a README attribution section. It runs locally with no hosted service or authentication. Reviewer cases use a disposable Git repository.
