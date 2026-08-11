# WORKBOOK-REFERENCE.md — Bellstrike Umbra v1.5 lvl-110 workbook extractions

Dev-only reference data from the community speed-rotation workbook
(`excels/Bellstrike Umbra lvl110 speed-rotation calculator v1.5.xlsx`, from
<https://h9dh.cn/>, BiliBili@片雲 / Violet).

Both files live in `reference/workbook/`.

| file | what it is |
| --- | --- |
| `umbraSkillCoefficients.wb1.5-lvl110.json` | curated coefficient table — the per-skill phys/attribute multipliers and flat values, translated column labels. This is the provenance for the numbers baked into `src/data/skills/**`; e.g. `tests/engine/bleedPerStackLadder.test.ts` cites its bleed rows. |
| `umbraWorkbook.wb1.5-lvl110.json` | full dump of all 38,519 non-empty cells across the 5 sheets (cached value + formula + type). Use it to trace where a coefficient comes from without opening Excel. |

**Both contain Chinese verbatim and must never be imported from `src/` or
`tests/`** — the app is English-only and CLAUDE.md's language rule requires
`grep -rlP '[\x{4e00}-\x{9fff}]' src tests` to return nothing. Copy values in by
hand (or via their English labels) rather than reading these at runtime.

The extractor script that produced the full dump (`scripts/extractUmbraWorkbook.mjs`,
referenced in its own `_meta.generatedBy`) has since been removed, as has
`scripts/i18n/zhToEnOfficial.json` — those official ZH↔EN pairs now live in
`reference/locale/zhToEnOfficial.json`. Regenerating the dump means re-writing
the extractor against the xlsx.

## `reference/workbook/legacy/`

Six raw workbook-derived dumps that used to sit in `src/data/` with no importer
anywhere in `src/`, `tests/` or the app. Kept here for provenance only — none
may ever be imported from `src/` or `tests/`.

| file | what it is |
| --- | --- |
| `calcOverview.json` | cached named outputs + header rows of the calc sheet |
| `panelDefaults.json` | panel sheet cells with their Excel formulas |
| `weaponArts.json` | weapon-art coefficient sheet with a `headers` array |
| `rotations.json` | per-rotation raw tick rows keyed by column letter |
| `damageBoosts.json` | flat name → boost map; its in-app successor, `boostZone.json`, was itself deleted 2026-08-10 as dead data (docs/CALCULATION.md § "Mind-method layers") |
| `mindMethods.json` | malformed inner-way extraction (literal `"undefined"` keys), superseded by the `panelStats` blocks on `src/data/innerWays/`'s modules |
