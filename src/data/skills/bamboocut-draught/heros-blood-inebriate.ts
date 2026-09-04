import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import type { TriggerCondition } from "../../../engine/skill"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const UNLOCKED: TriggerCondition[] = [{ buffId: BUFF.skyspeakUnlock, op: "gte", stacks: 1 }]

const aerialSlash = (index: number) =>
  hit(index, {
    frame: 60,
    physMultiplier: 0.3399,
    attributeMultiplier: 0.50985,
    physFixed: 94,
    attributeFixed: 51.25,
    conditions: UNLOCKED,
  })

const launchOrDash = {
  frame: 60,
  physMultiplier: 2.0394,
  attributeMultiplier: 3.0591,
  physFixed: 564,
  attributeFixed: 307.5,
  conditions: UNLOCKED,
}

// Coefficients: client skill_numerical_config row 20503106 at skill level
// 100 (patch container, 2026-09-04): 6.798 / 1880 / 1025, split by the
// client tooltip's ratios — launch 0.3, eight aerial slashes of 0.05, dash
// 0.3; attribute side × 1.5. Forced precision per the talent "Increased
// Binge Point Gain" rank 2. The dash ends the cast and with it Cloudvault.
export const herosBloodInebriate = defineSkill({
  id: SKILL.herosBloodInebriate,
  classId: "bamboocutDraught",
  name: "Twinblade Special - Inebriate",
  breakdownName: "Hero's Blood - Inebriate",
  tags: [WEAPON.twinBlades, ATTUNE.driftcleaveDeepdaze],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.herosBloodInebriate,
  guaranteedPrecision: true,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.cloudvault, BUFF.nonPlayerBaseDamage50],
  triggerable: false,
  castFrames: 60,
  hits: [
    hit(0, launchOrDash),
    aerialSlash(1),
    aerialSlash(2),
    aerialSlash(3),
    aerialSlash(4),
    aerialSlash(5),
    aerialSlash(6),
    aerialSlash(7),
    aerialSlash(8),
    hit(9, {
      ...launchOrDash,
      triggers: [applyBuff({ target: STATUS.cloudvault, stacks: -2 })],
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
