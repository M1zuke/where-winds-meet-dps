import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"

// A staggered target — read as the Qi-break window — grants 50 Binge Points
// once per 3 s. Hit frames: in-game animation colliders, 2026-09-05.
export const reveldriftHits = [
  hit(0, {
    frame: 19,
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
    frame: 24,
    physMultiplier: 0.528025,
    attributeMultiplier: 0.7920375,
    physFixed: 146.5,
    attributeFixed: 80,
  }),
]

// Cast length: in-game animation, 2026-09-05.
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
  castFrames: 66,
  hits: reveldriftHits,
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
