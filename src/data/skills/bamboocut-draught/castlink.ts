import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const JADEFLUSH = [{ buffId: STATUS.bingePoints, op: "gte" as const, stacks: 100 }]

const jadeflushKick = {
  id: "hv-castlink-jadeflush",
  label: "Jadeflush",
  conditions: JADEFLUSH,
  physMultiplier: 0.635355,
  attributeMultiplier: 0.9530325,
  physFixed: 176,
  attributeFixed: 95.75,
}

// Cast length to the earliest next input and hit frames: in-game animation,
// 2026-09-05.
export const castlink = defineSkill({
  id: SKILL.castlink,
  classId: "bamboocutDraught",
  name: "Castlink",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsMartialArt, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.castlink,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggersBuffs: [BUFF.jadeware],
  triggerable: false,
  castFrames: 49,
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.616165,
      attributeMultiplier: 0.9242475,
      physFixed: 171,
      attributeFixed: 93,
      variants: [{ ...jadeflushKick, castFrames: 89 }],
    }),
    hit(1, {
      frame: 28,
      physMultiplier: 0.616165,
      attributeMultiplier: 0.9242475,
      physFixed: 171,
      attributeFixed: 93,
      variants: [jadeflushKick],
    }),
    hit(2, {
      frame: 41,
      physMultiplier: 0.635355,
      attributeMultiplier: 0.9530325,
      physFixed: 176,
      attributeFixed: 95.75,
      conditions: JADEFLUSH,
    }),
    hit(3, {
      frame: 74,
      physMultiplier: 0.635355,
      attributeMultiplier: 0.9530325,
      physFixed: 176,
      attributeFixed: 95.75,
      conditions: JADEFLUSH,
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
