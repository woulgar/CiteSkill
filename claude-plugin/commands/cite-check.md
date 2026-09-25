---
description: Validate the CiteSkill manifest and CiteSkill-Refs trailers without modifying anything
argument-hint: "[optional git revision range to list trailers for, default: last 10 commits]"
---

Check CiteSkill citations in this repository. Do not modify any files.

Revision range for the trailer listing: $ARGUMENTS (if empty, use the last 10
commits on the current branch)

1. Run `citeskill validate --trailers` (or `node <path-to-CiteSkill>/dist/cli.js
   validate --trailers` if `citeskill` is not on `PATH`). This validates the
   manifest schema, checks that every cited commit exists, and checks
   `CiteSkill-Refs` IDs across all commits in `git log --all`. Report the result.
2. Run `citeskill summary` and report the declared shares briefly.
3. List `CiteSkill-Refs` trailers in the range, for example with
   `git log --format='%h %(trailers:key=CiteSkill-Refs,valueonly,separator=%x2C)' <range>`,
   and point out malformed lines the CLI would not read (misspelled key, empty
   value). Note that the CLI reads only the last `CiteSkill-Refs` line in a message.
4. Suggest fixes, but do not edit the manifest, rewrite history, or commit.
