# Marketplace review notes

CiteSkill ships two plugin packages: `plugins/citeskill` for Codex and
`claude-plugin` for Claude Code. Both teach citation workflows and bundle the
same local CLI. Neither package declares an MCP server, hook, account connection,
or background service.

## Data and execution

- The CLI reads the current Git repository and `.citeskill/citations.json`.
- `add` writes the citation manifest; `render --output` writes the requested
  Markdown file. The skill instructions limit that output to the project's
  README in the normal workflow.
- Git checks use `execFileSync('git', args)` with an argument array; citation
  values are validated before commit lookup. The CLI does not run a shell
  command assembled from citation text.
- The CLI has no network request or credential-reading code. A rendered badge
  points to Shields.io when someone views the README.
- Citations are user supplied. Prompts, transcripts, credentials, and private
  session content are excluded from the public record. The CLI does not commit
  or push automatically.

## Release checks

Before each submission or update:

1. Run `npm test`, `node dist/cli.js validate --trailers`, and the Codex plugin
   validator on `plugins/citeskill`.
2. Run `claude plugin validate --strict` on the Claude plugin manifest, skills,
   commands, and marketplace manifests.
3. Confirm the bundled `scripts/cli.js` and `scripts/core.js` match the tested
   TypeScript build, and inspect the archive or Git revision submitted for
   secrets, undeclared network calls, hooks, and executable dependencies.
4. Review the public privacy policy, source kinds, and percentage wording in
   both listings. Provide working positive and negative examples requested by
   each marketplace.
5. Resolve any automated findings with the reviewer using accurate descriptions
   of local CLI execution. Passing local validation does not mean a public
   marketplace has approved or published the plugin.

Official review guidance: [OpenAI plugin submission](https://developers.openai.com/plugins/deploy/submission),
[OpenAI security and privacy](https://developers.openai.com/plugins/guides/security-privacy),
and [Anthropic Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy).
