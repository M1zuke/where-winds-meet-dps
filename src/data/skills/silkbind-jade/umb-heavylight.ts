import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// The authored value is the whole cast spread over its hits, not a per-hit
// value — the reference def states it per hit. Kept as total ÷ hits so the
// number the source actually carries stays legible.
const CAST_HITS = 3
const CAST_TOTAL = {
  physMultiplier: 1.7001,
  attributeMultiplier: 2.5502,
  physFixed: 471,
  attributeFixed: 256,
}

const COEFFICIENTS = {
  physMultiplier: CAST_TOTAL.physMultiplier / CAST_HITS,
  attributeMultiplier: CAST_TOTAL.attributeMultiplier / CAST_HITS,
  physFixed: CAST_TOTAL.physFixed / CAST_HITS,
  attributeFixed: CAST_TOTAL.attributeFixed / CAST_HITS,
  extraCritDamage: 0,
}

export const umbHeavylight = defineSkill({
  id: SKILL.umbHeavylight,
  classId: "silkbindJade",
  name: "Umb HeavyLight",
  tags: [WEAPON.umbrella, ATTACK.mixed, ATTUNE.umbLightHeavyVariedCombo, ROLE.umbHeavyLight],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbHeavyLight,
  receives: [
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowLightBuff,
    BUFF.mistwillowBuff,
  ],
  castFrames: 75,
  triggerable: true,
  hits: [
    hit(0, { frame: 0, ...COEFFICIENTS }),
    hit(1, { frame: 25, ...COEFFICIENTS }),
    hit(2, { frame: 50, ...COEFFICIENTS }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
