import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The Martial Talent's Affinity DMG Bonus applies while Endless Gale is up.
// The direct-affinity half is Mountain's Might's, and lives on that inner way
// — putting it here too would apply it twice.
//
// The window itself — 5s from Qiankun's Lock's own cast start, or 5s (10s
// with Mountain's Might) from its end — is owned by the ledger gates in
// `../../../classes/bellstrike-splendor/gates.ts`; this module only reads
// them. Its own id is deliberately its own (not `BUFF.endlessGale`): an
// `alwaysActive` module is auto-registered under its own id for the whole
// fight, so reading that same id back would only ever see itself, never the
// gate's real bounded window.
export const endlessGale = defineClassBuff({
  id: BUFF.endlessGaleAffinityBoost,
  name: "Endless Gale",
  affectsAll: true,
  reachesDotTicks: false,
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +18%",
  effects: (ctx) =>
    ctx.status.isActive(BUFF.endlessGale) ? [stat("affinityDamageBoost", 0.18)] : [],
})

// The +18% does not stack with itself.
export const endlessGaleAtStart = defineClassBuff({
  id: BUFF.endlessGaleAtStartAffinityBoost,
  name: "Endless Gale (from the cast's start)",
  affectsAll: true,
  reachesDotTicks: false,
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +18%, except while the cast-end copy already grants it",
  effects: (ctx) =>
    ctx.status.isActive(BUFF.endlessGale) || !ctx.status.isActive(BUFF.endlessGaleAtStart)
      ? []
      : [stat("affinityDamageBoost", 0.18)],
})
