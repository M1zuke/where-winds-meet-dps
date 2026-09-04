import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"

// A staggered target — read as the Qi-break window — grants 50 Binge Points
// once per 3 s. Cast length: community speed-rotation workbook v2.0,
// 2026-09-04, 0.7 s; hit spacing provisional.
export const reveldrift = defineSkill({
  id: SKILL.reveldrift,
  classId: "bamboocutDraught",
  name: "Twinblade Q",
  breakdownName: "Reveldrift",
  tags: [WEAPON.twinBlades, ATTUNE.twinbladesMartialArt, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.reveldrift,
  receives: CLASS_RECEIVES,
  triggersBuffs: [BUFF.jadeware],
  triggerable: false,
  castFrames: 42,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.528025,
      attributeMultiplier: 0.7920375,
      physFixed: 146.5,
      attributeFixed: 80,
      triggers: [
        applyDebuff({ target: DEBUFF.strayhunt, stacks: 1 }),
        applyBuff({
          target: STATUS.bingePoints,
          stacks: 50,
          phase: "exhausted",
          cooldownFrames: 180,
        }),
      ],
    }),
    hit(1, {
      frame: 21,
      physMultiplier: 0.528025,
      attributeMultiplier: 0.7920375,
      physFixed: 146.5,
      attributeFixed: 80,
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
