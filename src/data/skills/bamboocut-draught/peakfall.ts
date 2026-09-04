import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const JADEFLUSH = [{ buffId: STATUS.bingePoints, op: "gte" as const, stacks: 100 }]

// Coefficients: client skill_numerical_config at skill level 100 (patch
// container, 2026-09-04) — Peakfall 20902101 (0.91934 / 255 / 139) as one
// hit, Peakfall - Jadeflush 20902103 (1.57564 / 437 / 238) over the client
// hit table's 2 hits, split evenly as a provisional per-hit share; attribute
// side × 1.5.
export const peakfall = defineSkill({
  id: SKILL.peakfall,
  classId: "bamboocutDraught",
  name: "Peakfall",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsMartialArt, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.peakfall,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggersBuffs: [BUFF.jadeware],
  triggerable: false,
  castFrames: -1,
  hits: [
    hit(0, {
      frame: -1,
      physMultiplier: 0.91934,
      attributeMultiplier: 1.37901,
      physFixed: 255,
      attributeFixed: 139,
      variants: [
        {
          id: "hv-peakfall-jadeflush",
          label: "Jadeflush",
          conditions: JADEFLUSH,
          physMultiplier: 0.78782,
          attributeMultiplier: 1.18173,
          physFixed: 218.5,
          attributeFixed: 119,
          castFrames: -1,
        },
      ],
    }),
    hit(1, {
      frame: -1,
      physMultiplier: 0.78782,
      attributeMultiplier: 1.18173,
      physFixed: 218.5,
      attributeFixed: 119,
      conditions: JADEFLUSH,
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
