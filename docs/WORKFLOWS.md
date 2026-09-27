# Attribution maintenance

Run these commands from the repository root. Replace example IDs and SHAs with your own. Node.js 20+ and Git are required.

## Correct citations

```sh
citeskill update --id model-example --name "Correct model" --share 40
citeskill update --id model-example --unset share,provider
citeskill remove --id unused-example
citeskill normalize
```

IDs remain stable when updating. Removal is refused when a reachable commit references that ID; update the record instead. `normalize` persists full commit SHAs. Git-aware CLI commands resolve short SHAs before aggregation and reject combined totals above 100%. The standalone core library requires callers to supply canonical references.

## Merge, squash and rebase

Prefer PR references while a pull request is in progress. Ordinary merges preserve commit references. Squash/rebase rewrites commit IDs: explicitly relink affected citations after the replacement commit exists, then commit the updated manifest separately.

```sh
citeskill relink --ids model-example,skill-example --ref-type pr --ref 42
# Or use the full SHA of the replacement commit:
citeskill relink --ids model-example,skill-example --ref-type commit --ref REPLACEMENT_SHA
citeskill commit-link --ids model-example,skill-example
citeskill validate --trailers
citeskill render --output README.md
```

Relink preserves IDs and does not guess equivalence between old and new work. If combining work units would exceed 100%, unset estimates before rewriting history and explicitly declare revised estimates afterward. Relink all missing commit references in one operation, or restore the old objects before repairing them. Keep `CiteSkill-Refs` in the squash message; Git does not guarantee trailer preservation. Commit and PR references are distinct work units even if they describe related work.

## Estimate coverage

Agent and model estimates have separate denominators: each is an equal-weight average over work units with a declared estimate of that kind. Provider percentages aggregate model estimates using the model denominator. Missing provider labels remain unallocated. Coverage shows declared agent/model/provider-labeled work units out of all cited work units, including citation-only work. A zero estimate is still a declaration. Coverage counts work units, not lines, tokens, time, or measured authorship. Skills, plugins, apps, MCP servers and projects receive citations only.

## Schema and CI

Use [the JSON Schema](../schema/citations.schema.json) for editor validation. Configure it externally: schema v1 does not allow a `$schema` property in citation files. Unique IDs, total percentages, Git existence and trailer checks require the CLI.

Copy [the CI example](../examples/citeskill-validation.yml) to `.github/workflows/citeskill.yml`. Pin its CiteSkill checkout to a reviewed commit for reproducibility. Fetch full history so cited commits are available. No API keys or model credentials are required.
