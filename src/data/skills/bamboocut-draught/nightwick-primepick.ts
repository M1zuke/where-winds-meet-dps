import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

// Coefficients: client skill_numerical_config at skill level 100 (patch
// container, 2026-09-04) — opener 20902108 (0.9444 / 262 / 143), Break
// Defense Finger Thrust 20902110 (0.64565 / 180 / 98), and the Tri-strike
// third stage 20902111 (2.6052 / 721 / 393) at the tooltip's 0.33, which
// the tooltip names a Deepdaze stage; attribute side × 1.5. The guard-breaking
// jab inflicts Wildstride (client locale text, 2026-09-04).
export const nightwickPrimepick = defineSkill({
  id: SKILL.nightwickPrimepick,
  classId: "bamboocutDraught",
  name: "Gauntlet Special - Primepick",
  breakdownName: "Nightwick - Primepick",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.nightwickPrimepick,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggerable: false,
  castFrames: 60,
  hits: [
    hit(0, {
      frame: 60,
      physMultiplier: 0.9444,
      attributeMultiplier: 1.4166,
      physFixed: 262,
      attributeFixed: 143,
    }),
    hit(1, {
      frame: 60,
      physMultiplier: 0.64565,
      attributeMultiplier: 0.968475,
      physFixed: 180,
      attributeFixed: 98,
      triggers: [applyDebuff({ target: DEBUFF.wildstride, stacks: 1 })],
    }),
    hit(2, {
      frame: 60,
      physMultiplier: 0.859716,
      attributeMultiplier: 1.289574,
      physFixed: 237.93,
      attributeFixed: 129.69,
      conditions: [{ buffId: STATUS.inebriateDeepdaze, op: "gte", stacks: 1 }],
      triggers: [applyDebuff({ target: DEBUFF.nightwickExposure, stacks: 1, phase: "exhausted" })],
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
