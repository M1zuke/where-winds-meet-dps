// Hand-authored ports of the reference site's "mechanic list" defs (`kb`/`Gm` in
// the deobfuscated bundle). This module currently covers Soul Shaken
// (`kb.soulShaken`) only — `dragonBreath`'s Fire Breath → Combustion extension
// machinery (`xn`) is modeled elsewhere, as `extendFrames`/`extendOnly`
// triggers on the per-class skill data (see docs/CALCULATION.md § "Mechanic
// coverage").
//
// The def bodies live in src/data/skills/buffs/soulShaken.ts,
// bellstrikeUmbraBleedPen.ts and bellstrikeUmbraBleedingDamage.ts — the
// two swordHorizon-gated ones port the site's `Nm` mechanic
// (`.tmp/site/deobfuscated.js` ~L5544-59, read via `gr()` ~L21817-58).
// `physPen`/`bellstrikePen: 15` and `affinityDmg: 0.18` are the site's
// maxPhys-anchored values (pen anchor 1500, affinity anchor 500) that clamp
// to 1 only because this app's supported level 95 gives maxPhys ≈ 2984.
export { MECHANIC_BUFF_DEFS } from "../../data/skills/buffs"
