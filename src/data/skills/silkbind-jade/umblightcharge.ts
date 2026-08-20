import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// The reference def carries these as ONE cast total spread over six hits, not
// as a per-hit value: every other multi-hit skill in the reference set — 31 of
// them across five specs — has a per-hit coefficient equal to its cast total
// divided by its hit count, and the ÷3 ones still carry the repeating decimal
// that proves it. This is the only multi-hit def whose value was left undivided,
// which is why its 1.7173 sits alongside SINGLE-hit skills (FanLightCharged
// 1.9039, UmbQ 2.3389) instead of below them.
//
// Kept as total ÷ hits rather than six decimals, so the number the reference
// actually states stays legible.
const CAST_HITS = 6
const CAST_TOTAL = {
  physMultiplier: 1.7173,
  attributeMultiplier: 2.576,
  physFixed: 396,
  attributeFixed: 221,
}

const COEFFICIENTS = {
  physMultiplier: CAST_TOTAL.physMultiplier / CAST_HITS,
  attributeMultiplier: CAST_TOTAL.attributeMultiplier / CAST_HITS,
  physFixed: CAST_TOTAL.physFixed / CAST_HITS,
  attributeFixed: CAST_TOTAL.attributeFixed / CAST_HITS,
  extraCritDamage: 1,
}

export const umblightcharge = defineSkill({
  id: SKILL.umblightcharge,
  classId: "silkbindJade",
  name: "UmbLightCharge",
  tags: [
    PROP.isCharged,
    PROP.hasQiBreakPhysPen,
    WEAPON.umbrella,
    ATTACK.light,
    ATTUNE.umbFrequentProjectile,
    ROLE.umbLightCharge,
  ],
  skillType: "sustain",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbLightCharge,
  receives: [
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    BUFF.combo,
    BUFF.comboUmbLightBonus,
    BUFF.windWall,
    BUFF.pursuitChargedBoost,
    BUFF.trajectorySkill,
    BUFF.thunderousBloom,
    BUFF.springThunder,
  ],
  castFrames: 147,
  triggerable: true,
  hits: [
    hit(0, { frame: 0, ...COEFFICIENTS }),
    hit(1, { frame: 10, ...COEFFICIENTS }),
    hit(2, { frame: 20, ...COEFFICIENTS }),
    hit(3, { frame: 30, ...COEFFICIENTS }),
    hit(4, { frame: 40, ...COEFFICIENTS }),
    hit(5, { frame: 50, ...COEFFICIENTS }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
