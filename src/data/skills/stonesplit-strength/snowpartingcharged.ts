import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

export const snowpartingcharged = defineSkill({
  id: SKILL.snowpartingcharged,
  classId: "stonesplitStrength",
  name: "SnowpartingCharged",
  tags: [PROP.isCharged, WEAPON.hengBlade, ATTACK.charge, ATTUNE.snowpartingCharged],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingCharged,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  castFrames: 97,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.4899,
      attributeMultiplier: 0.734867,
      physFixed: 135.6,
      attributeFixed: 73.8,
    }),
    hit(1, {
      frame: 24,
      physMultiplier: 0.4899,
      attributeMultiplier: 0.734867,
      physFixed: 135.6,
      attributeFixed: 73.8,
    }),
    hit(2, {
      frame: 48,
      physMultiplier: 0.4899,
      attributeMultiplier: 0.734867,
      physFixed: 135.6,
      attributeFixed: 73.8,
    }),
    hit(3, {
      frame: 72,
      physMultiplier: 0.9798,
      attributeMultiplier: 1.4697,
      physFixed: 271.2,
      attributeFixed: 147.6,
      // In-game grant frame as of 2026-09-26: 82.6 f from the press, nearest this hit.
      triggers: [
        applyBuff({
          target: BUFF.snowbreakSpringAvailable,
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 3,
        }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
