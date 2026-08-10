// Source of truth: `.tmp/site/deobfuscated.js` — the inner-way registry's
// `{ name, key, path, combatToggle, enabledBuffs, tiers }` entries and the set
// registry `Ps` (`{ name, key, twoPiece, fourPiece }`), cross-checked against
// this app's own data (`src/data/classes/schools.json` `allowedMindMethods` /
// `classMindGroup`, `src/data/sets/`). Set id ↔ site key lives on each
// `SetDef.siteKey` in `src/data/sets/`, not here.
//
// Only the five implemented inner ways can be mapped (2026-08-10) — the other
// 23 were deleted as unimplemented, so every site param naming one is
// unmappable by construction rather than by decision. Any def gated on such a
// param can never activate; those defs are kept as ported reference data.
//
// Intentional gaps among what remains (left unmapped — do not "complete" these
// without new verification):
//   - `revelryScript` — a rotation/team-support toggle in the site (default
//     params + `userQiTimingOverrides`), not a character-build attribute. It
//     reaches the engine through `combatSettings` instead.
//   - `insightfulStrike` (`Insightful Strike`) — VERIFIED as the right inner
//     way, but deliberately left UNMAPPED after an overlap audit: the only
//     def gated by it (`concentration`) is composed entirely of
//     `affinityDmg` / `directAffinity` / `dotDamage` + `enhancedDotDamage`
//     stat modifiers — every one of those channels (`affinityDamageBoost`,
//     `directAffinityRate`, `sustainDamageBoost`) is ALREADY baked into the
//     panel's own Insightful Strike model (`bellstrikeUmbraConcentration.ts`'s
//     `EFFECTS`, fed through `buildContext`'s `dotDamageBoost` — see
//     `insightfulStrike.test.ts`). Mapping it would double-count those
//     bonuses on top of the panel model with zero new content from the site
//     buff. If `concentration` is ever extended with a genuinely new
//     (non-overlapping) effect, re-derive this decision before mapping it.
//   - `starsAlignBonus` (the `starsAlign4pc` buff's per-stack value) — the
//     site computes this stochastically from distance/stacks at runtime; we
//     have no deterministic value, so equipping `Stars Align` enables the
//     buff but it contributes 0.
//   - Hawking (`Hawking`) 4-piece ramping — handled side by a
//     time-averaged scheduler (`getBonusAtTime`/`avgBonus`), not the
//     deterministic buff catalog. Out of scope here.

export interface InnerWayMapping {
  innerWayId: string
  classSignature?: boolean
}

const SELECTABLE_INNER_WAYS: Record<string, InnerWayMapping> = {
  wolfchasersArt: { innerWayId: "wolfchasersArt" },
  moraleChant: { innerWayId: "moraleChant" },
}

const CLASS_SIGNATURE_INNER_WAYS: Record<string, InnerWayMapping> = {
  swordHorizon: { innerWayId: "swordHorizon", classSignature: true },
}

export const SITE_PARAM_TO_INNER_WAY: Record<string, InnerWayMapping> = {
  ...SELECTABLE_INNER_WAYS,
  ...CLASS_SIGNATURE_INNER_WAYS,
}

export const INNER_WAY_BY_PARAM: Record<string, string> = Object.fromEntries(
  Object.entries(SITE_PARAM_TO_INNER_WAY).map(([param, m]) => [param, m.innerWayId]),
)

export function zhongToTier(stacks: string): number {
  if (!stacks) return 0
  const match = /(\d+)/.exec(stacks)
  return match ? Number(match[1]) : 0
}
