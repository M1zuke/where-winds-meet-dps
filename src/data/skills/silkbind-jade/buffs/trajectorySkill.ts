import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { artBonus } from "../../../../engine/effects/effect"

// The base 5 and the boosted 20 are the reference implementation's own values
// (`.tmp/site/deobfuscated.js` ~L42150-42174), which is why the boost is gated
// on qi-break or Lingering Bone rather than on the talent panel's "immobilized
// or airborne". Do not reconcile the two toward the panel text without a source
// that settles it.
const BASE_PENETRATION = 5
const BOOSTED_PENETRATION = 20

export const trajectorySkill = defineClassBuff({
  id: BUFF.trajectorySkill,
  name: "Trajectory Skill",
  alwaysActive: true,
  duration: 9999,
  summary: "ignores 5 Physical Resistance, 20 during qi break or Lingering Bone",
  effects: (ctx) => [
    artBonus(
      "extraPhysPenetration",
      ctx.phase === "exhausted" || ctx.status.isActive(BUFF.lingeringBone)
        ? BOOSTED_PENETRATION
        : BASE_PENETRATION,
    ),
  ],
})
