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

// Coefficients: client skill_numerical_config at skill level 100 (patch
// container, 2026-09-04) — Castlink 20902102 (1.23233 / 342 / 186) as two
// kicks of the tooltip's 0.5, Castlink - Jadeflush 20902104
// (2.54142 / 704 / 383) as four kicks of 0.25; attribute side × 1.5.
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
  castFrames: -1,
  hits: [
    hit(0, {
      frame: -1,
      physMultiplier: 0.616165,
      attributeMultiplier: 0.9242475,
      physFixed: 171,
      attributeFixed: 93,
      variants: [{ ...jadeflushKick, castFrames: -1 }],
    }),
    hit(1, {
      frame: -1,
      physMultiplier: 0.616165,
      attributeMultiplier: 0.9242475,
      physFixed: 171,
      attributeFixed: 93,
      variants: [jadeflushKick],
    }),
    hit(2, {
      frame: -1,
      physMultiplier: 0.635355,
      attributeMultiplier: 0.9530325,
      physFixed: 176,
      attributeFixed: 95.75,
      conditions: JADEFLUSH,
    }),
    hit(3, {
      frame: -1,
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
