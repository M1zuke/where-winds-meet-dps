// Source of truth: `.tmp/site/deobfuscated.js` — the inner-way registry's
// `{ name, key, path, combatToggle, enabledBuffs, tiers }` entries and the set
// registry `Ps` (`{ name, key, twoPiece, fourPiece }`), cross-checked against
// this app's own data (`src/data/classes/schools.json` `allowedMindMethods` /
// `classMindGroup`, `src/data/sets/sets.json`).
//
// Intentional gaps (left unmapped — do not "complete" these without new
// verification):
//   - `thunderousBloom` — Silkbind-Jade inner way; no confirmed app inner way
//     (candidate `Bliss Bleeding` is unverified). Also keeps the locked
//     `bamboocutWindTwinblade` default fixture — whose build contains `Bliss Bleeding` —
//     unperturbed.
//   - `restoringBlossom` — registry `path: "silkbind_deluge"`; no app class
//     has that spec.
//   - `revelryScript` — a rotation/team-support toggle in the site (default
//     params + `userQiTimingOverrides`), not a character-build attribute.
//   - `insightfulStrike` (`Insightful Strike`) — VERIFIED as the right inner
//     way, but deliberately left UNMAPPED after an overlap audit: the only
//     def gated by it (`concentration`) is composed entirely of
//     `affinityDmg` / `directAffinity` / `dotDamage` + `enhancedDotDamage`
//     stat modifiers — every one of those channels (`affinityDamageBoost`,
//     `directAffinityRate`, `sustainDamageBoost`) is ALREADY baked into the
//     panel's own Insightful Strike model (`src/data/baseStats/mindMethodPanelStats.json`'s
//     `directAffinityRate` baseline, `mindMethodOverrides.ts`'s per-art
//     `extraAffinityDamage`, and `buildContext`'s `dotDamageBoost` — see
//     `insightfulStrike.test.ts`). Mapping it would double-count those bonuses
//     on top of the panel model with zero new content from the site buff. If
//     `concentration` is ever extended with a genuinely new (non-overlapping)
//     effect, re-derive this decision before mapping it.
//   - `starsAlignBonus` (the `starsAlign4pc` buff's per-stack value) — the
//     site computes this stochastically from distance/stacks at runtime; we
//     have no deterministic value, so equipping `Stars Align` enables the
//     buff but it contributes 0.
//   - `ivorybloom` / `rainwhisper` — both exist in the site registry, but this
//     app no longer carries either set: they were removed once their flat
//     always-on 2-pc/4-pc rows were judged wrong (GitHub #22, #23). Re-add the
//     mapping only as part of modelling them properly.
//   - Hawking (`Hawking`) 4-piece ramping — handled side by a
//     time-averaged scheduler (`getBonusAtTime`/`avgBonus`), not the
//     deterministic buff catalog. Out of scope here.

export interface InnerWayMapping {
  mindMethod: string
  classSignature?: boolean
}

const SELECTABLE_INNER_WAYS: Record<string, InnerWayMapping> = {
  wolfchasersArt: { mindMethod: "Wolfchaser's Art" },
  throatPierced: { mindMethod: "Throat-Pierce" },
  mountainsMight: { mindMethod: "Thousand Mountain Law" },
  songOfTang: { mindMethod: "Tang Anthem" },
  starReacher: { mindMethod: "Star-Picker" },
  artOfResistance: { mindMethod: "Endurance Doctrine" },
  steadfastDevotion: { mindMethod: "Steadfast Devotion" },
  towlineSweep: { mindMethod: "Boat on Wood" },
  moraleChant: { mindMethod: "Morale Chant" },
}

const CLASS_SIGNATURE_INNER_WAYS: Record<string, InnerWayMapping> = {
  swordHorizon: { mindMethod: "Sword Horizon", classSignature: true },
  combo: { mindMethod: "Moon Above Flowers", classSignature: true },
  frostCladNight: { mindMethod: "Frost-Clad Night", classSignature: true },
}

export const SITE_PARAM_TO_INNER_WAY: Record<string, InnerWayMapping> = {
  ...SELECTABLE_INNER_WAYS,
  ...CLASS_SIGNATURE_INNER_WAYS,
}

export const INNER_WAY_BY_PARAM: Record<string, string> = Object.fromEntries(
  Object.entries(SITE_PARAM_TO_INNER_WAY).map(([param, m]) => [param, m.mindMethod]),
)

export const APP_SET_TO_SITE_SET: Record<string, string> = {
  Hawking: "hawkwing",
  Jadeware: "jadeware",
  Mistwillow: "mistwillow",
  "Stars Align": "starsAlign",
  "Shattered Ridge": "shatteredridge",
}

export const SITE_SET_TO_APP_SET: Record<string, string> = Object.fromEntries(
  Object.entries(APP_SET_TO_SITE_SET).map(([app, site]) => [site, app]),
)

export function zhongToTier(stacks: string): number {
  if (!stacks) return 0
  const match = /(\d+)/.exec(stacks)
  return match ? Number(match[1]) : 0
}
