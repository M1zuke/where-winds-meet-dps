import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { skillBingePointAccumulationTriggers } from "./buffs/skillBingePointAccumulation"

// In-game values as of 2026-09-16.
const REQUIRES_BINGE_100 = [{ buffId: STATUS.bingePoints, op: "gte" as const, stacks: 100 }]

// Cast length to the earliest next input and hit frame: in-game animation,
// 2026-09-05.
export const nightwickPrimepick = defineSkill({
  id: SKILL.nightwickPrimepick,
  classId: "bamboocutDraught",
  name: "Gauntlet Special - Tipsylay",
  breakdownName: "Nightwick - Tipsylay",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.nightwickPrimepick,
  receives: [
    ...INEBRIATE_ENHANCED_RECEIVES,
    ...SKYSTRIKE_GAUNTLETS_RECEIVES,
    BUFF.nonPlayerBaseDamage40,
  ],
  triggerable: false,
  castFrames: 51,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.9444,
      attributeMultiplier: 1.4166,
      physFixed: 262,
      attributeFixed: 143,
      conditions: REQUIRES_BINGE_100,
      triggers: skillBingePointAccumulationTriggers,
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
