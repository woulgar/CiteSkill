import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
export const MANIFEST = '.citeskill/citations.json';
export const KINDS = ['agent', 'model', 'skill', 'plugin', 'app', 'mcp', 'project'];
const isObject = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
const isSafeUrl = (x) => {
    if (typeof x !== 'string' || /[\s\\]/.test(x))
        return false;
    try {
        const url = new URL(x);
        return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
    }
    catch {
        return false;
    }
};
const refKey = (e) => `${e.ref.type}:${e.ref.value}`;
export function validate(data) {
    const errors = [];
    if (!isObject(data) || data.schemaVersion !== 1 || !Array.isArray(data.entries))
        return ['Expected schemaVersion 1 and an entries array.'];
    const ids = new Set();
    const shares = new Map();
    data.entries.forEach((raw, i) => {
        const p = `entries[${i}]`;
        if (!isObject(raw)) {
            errors.push(`${p} must be an object.`);
            return;
        }
        if (typeof raw.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(raw.id))
            errors.push(`${p}.id must be a unique lowercase slug (2-64 characters).`);
        else if (ids.has(raw.id))
            errors.push(`${p}.id is duplicated.`);
        else
            ids.add(raw.id);
        if (!KINDS.includes(raw.kind))
            errors.push(`${p}.kind is invalid.`);
        if (typeof raw.name !== 'string' || !raw.name.trim() || /[\r\n]/.test(raw.name))
            errors.push(`${p}.name must be a nonempty single line.`);
        if (!isObject(raw.ref) || !['commit', 'pr'].includes(String(raw.ref.type)) || typeof raw.ref.value !== 'string' || !raw.ref.value.trim())
            errors.push(`${p}.ref must contain a commit or PR and a value.`);
        else if (raw.ref.type === 'commit' && !/^[0-9a-f]{7,40}$/i.test(raw.ref.value))
            errors.push(`${p}.ref.value must be a Git commit SHA.`);
        else if (raw.ref.type === 'pr' && !/^[1-9]\d*$/.test(raw.ref.value))
            errors.push(`${p}.ref.value must be a positive PR number.`);
        if (isObject(raw.ref))
            for (const key of Object.keys(raw.ref))
                if (!['type', 'value'].includes(key))
                    errors.push(`${p}.ref.${key} is not part of schema v1.`);
        for (const key of ['url', 'evidenceUrl'])
            if (raw[key] !== undefined && !isSafeUrl(raw[key]))
                errors.push(`${p}.${key} must be an HTTPS URL.`);
        for (const key of ['provider', 'model'])
            if (raw[key] !== undefined && (typeof raw[key] !== 'string' || !raw[key].trim() || /[\r\n]/.test(raw[key])))
                errors.push(`${p}.${key} must be a nonempty single line.`);
        if (raw.estimatedShare !== undefined) {
            if (!['agent', 'model'].includes(String(raw.kind)))
                errors.push(`${p}.estimatedShare is only valid for agent or model entries.`);
            if (typeof raw.estimatedShare !== 'number' || !Number.isFinite(raw.estimatedShare) || raw.estimatedShare < 0 || raw.estimatedShare > 100)
                errors.push(`${p}.estimatedShare must be between 0 and 100.`);
            else if (isObject(raw.ref) && typeof raw.ref.value === 'string') {
                const key = `${raw.ref.type}:${raw.ref.value}:${raw.kind}`;
                shares.set(key, (shares.get(key) ?? 0) + raw.estimatedShare);
            }
        }
        const allowed = new Set(['id', 'kind', 'name', 'ref', 'url', 'provider', 'model', 'estimatedShare', 'evidenceUrl']);
        for (const key of Object.keys(raw))
            if (!allowed.has(key))
                errors.push(`${p}.${key} is not part of schema v1.`);
    });
    for (const [key, value] of shares)
        if (value > 100.000001)
            errors.push(`Estimated shares for ${key} exceed 100%.`);
    for (const key of Object.keys(data))
        if (!['schemaVersion', 'entries'].includes(key))
            errors.push(`Unknown manifest field: ${key}.`);
    return errors;
}
export function load(root) {
    const path = join(root, MANIFEST);
    if (!existsSync(path))
        throw new Error(`Missing ${MANIFEST}. Run citeskill init.`);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const errors = validate(data);
    if (errors.length)
        throw new Error(errors.join('\n'));
    return data;
}
export function save(root, manifest) {
    const errors = validate(manifest);
    if (errors.length)
        throw new Error(errors.join('\n'));
    mkdirSync(join(root, '.citeskill'), { recursive: true });
    writeFileSync(join(root, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
}
export function init(root) {
    if (existsSync(join(root, MANIFEST)))
        throw new Error(`${MANIFEST} already exists.`);
    save(root, { schemaVersion: 1, entries: [] });
}
export function summarize(manifest) {
    const groups = new Map();
    for (const e of manifest.entries)
        if (e.estimatedShare !== undefined) {
            const key = refKey(e);
            groups.set(key, [...(groups.get(key) ?? []), e]);
        }
    const result = { model: Object.create(null), provider: Object.create(null), agent: Object.create(null), workUnits: groups.size };
    if (!groups.size)
        return result;
    const modelUnits = [...groups.values()].filter(entries => entries.some(e => e.kind === 'model')).length;
    const agentUnits = [...groups.values()].filter(entries => entries.some(e => e.kind === 'agent')).length;
    for (const entries of groups.values())
        for (const e of entries) {
            const contribution = e.estimatedShare / (e.kind === 'agent' ? agentUnits : modelUnits);
            if (e.kind === 'agent')
                result.agent[e.name] = (result.agent[e.name] ?? 0) + contribution;
            if (e.kind === 'model') {
                const name = e.model ?? e.name;
                result.model[name] = (result.model[name] ?? 0) + contribution;
                if (e.provider)
                    result.provider[e.provider] = (result.provider[e.provider] ?? 0) + contribution;
            }
        }
    return result;
}
export function parseTrailer(message) {
    const lines = message.trimEnd().split(/\r?\n/);
    const trailer = [...lines].reverse().find(line => /^CiteSkill-Refs:\s*/i.test(line));
    return trailer ? trailer.replace(/^CiteSkill-Refs:\s*/i, '').split(',').map(x => x.trim()).filter(Boolean) : [];
}
export function render(manifest) {
    const summary = summarize(manifest);
    const pct = (n) => `${Number(n.toFixed(1))}%`;
    const clean = (s) => s.replace(/[|\r\n<>\[\]]/g, ' ').replace(/[`*_!\\]/g, ' ').trim();
    const sorted = (r) => Object.entries(r).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${clean(k)}: ${pct(v)}`).join(', ') || 'Not declared';
    const lines = ['<!-- citeskill:start -->', '## Agentic citations', '', '![CiteSkill](https://img.shields.io/badge/attribution-CiteSkill-blue)', '', 'Contribution shares below are user-declared estimates averaged across cited commits and PRs. They are not measured authorship.', '', `**Estimated model shares:** ${sorted(summary.model)}`, '', `**Estimated provider shares:** ${sorted(summary.provider)}`, '', `**Estimated agent shares:** ${sorted(summary.agent)}`, '', '| Kind | Source | Work |', '| --- | --- | --- |'];
    for (const e of manifest.entries) {
        const label = clean(e.name);
        const source = e.url ? `[${label}](${e.url.replace(/\(/g, '%28').replace(/\)/g, '%29')})` : label;
        lines.push(`| ${e.kind} | ${source} | ${e.ref.type} ${clean(e.ref.value)} |`);
    }
    lines.push('', '<!-- citeskill:end -->');
    return lines.join('\n');
}
