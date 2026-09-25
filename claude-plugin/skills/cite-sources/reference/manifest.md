# `.citeskill/citations.json` (schemaVersion 1)

Source of truth: `validate()` in `src/core.ts`. The CLI rejects a manifest that
breaks any rule below, including unknown fields.

## Top level

| Field           | Type    | Required | Notes                     |
|-----------------|---------|----------|---------------------------|
| `schemaVersion` | integer | yes      | Must be `1`.              |
| `entries`       | array   | yes      | List of citation entries. |

No other top-level fields are allowed.

## Entry fields

| Field            | Type   | Required | Notes |
|------------------|--------|----------|-------|
| `id`             | string | yes      | Unique lowercase slug, `^[a-z0-9][a-z0-9-]{1,63}$`. Referenced from `CiteSkill-Refs`. |
| `kind`           | string | yes      | One of the kinds below. |
| `name`           | string | yes      | Nonempty, single line, e.g. `Claude Code`. |
| `ref`            | object | yes      | `{ "type": "commit" \| "pr", "value": string }`. Commit values are 7-40 hex characters; PR values are digits. |
| `url`            | string | no       | Public `https://` URL for the source. |
| `provider`       | string | no       | Nonempty, single line, e.g. `Anthropic`. |
| `model`          | string | no       | Nonempty, single line. Exact model ID, only when known. |
| `estimatedShare` | number | no       | 0-100, user-declared estimate, only for `agent` and `model`. For each `ref` + `kind`, shares total at most 100. Not an authorship claim. |
| `evidenceUrl`    | string | no       | `https://` URL the user explicitly chose to share. Never a transcript you created or uploaded. |

## Kinds

- `agent`: an agentic coding tool (e.g. Claude Code).
- `model`: a foundation model. `summary` groups by `model` (or `name`) and
  `provider`.
- `skill`: an agent skill whose instructions shaped the work.
- `plugin`: an agent plugin.
- `app`: another AI-powered application.
- `mcp`: an MCP server whose tool output shaped the work.
- `project`: a source project the work directly used. Cite the project itself, not
  its own citations.

## Summary semantics

Each distinct `ref` with at least one `estimatedShare` counts as one work unit.
`summary` and `render` average agent, model, and provider shares across work units;
unallocated share stays unknown.

## Example

```json
{
  "schemaVersion": 1,
  "entries": [
    {
      "id": "claude-code-a1b2c3d",
      "kind": "agent",
      "name": "Claude Code",
      "ref": { "type": "commit", "value": "a1b2c3d" },
      "provider": "Anthropic"
    }
  ]
}
```

Matching trailer in the follow-up commit that records the citation:

```
CiteSkill-Refs: claude-code-a1b2c3d
```

## Choosing what to cite

Cite a source if **all** are true:

- It generated, rewrote, or materially directed content in the cited work.
- The user (or the running agent, about itself) knows this directly.

Do **not** cite:

- Tools that were available but unused for this work.
- Sources used only for unrelated tasks in the same session.
- Humans (human authorship stays in git).
- Anything inferred by scanning private transcripts, logs, or other users' data.
