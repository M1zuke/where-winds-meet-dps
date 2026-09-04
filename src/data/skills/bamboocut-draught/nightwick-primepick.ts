import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

// Coefficients: client skill_numerical_config at skill level 100 (patch
// container, 2026-09-04) — opener 20902108 (0.9444 / 262 / 143), Break
// Defense Finger Thrust 20902110 (0.64565 / 180 / 98), and the Tri-strike
// third stage 20902111 (2.6052 / 721 / 393) at the tooltip's 0.33, which
// the tooltip names a Deepdaze stage; attribute side × 1.5.
export const nightwickPrimepick = defineSkill({
  id: SKILL.nightwickPrimepick,
  classId: "bamboocutDraught",
  name: "Nightwick - Primepick",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.nightwickPrimepick,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggerable: false,
  castFrames: -1,
  hits: [
    hit(0, {
      frame: -1,
      physMultiplier: 0.9444,
      attributeMultiplier: 1.4166,
      physFixed: 262,
      attributeFixed: 143,
    }),
    hit(1, {
      frame: -1,
      physMultiplier: 0.64565,
      attributeMultiplier: 0.968475,
      physFixed: 180,
      attributeFixed: 98,
    }),
    hit(2, {
      frame: -1,
      physMultiplier: 0.859716,
      attributeMultiplier: 1.289574,
      physFixed: 237.93,
      attributeFixed: 129.69,
      conditions: [{ buffId: STATUS.inebriateDeepdaze, op: "gte", stacks: 1 }],
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
