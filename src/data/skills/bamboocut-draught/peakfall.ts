import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, ATTUNE, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"
import { eonpourExhaustedTriggers } from "./buffs/eonpourExhausted"

const JADEFLUSH = [{ buffId: STATUS.bingePoints, op: "gte" as const, stacks: 100 }]

// Cast length to the earliest next input and hit frames: in-game animation,
// 2026-09-05.
export const peakfall = defineSkill({
  id: SKILL.peakfall,
  classId: "bamboocutDraught",
  name: "Gauntlet Q",
  breakdownName: "Peakfall",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsMartialArt, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.peakfall,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggersBuffs: [BUFF.jadeware],
  triggerable: false,
  castFrames: 38,
  hits: [
    hit(0, {
      frame: 20,
      physMultiplier: 0.91934,
      attributeMultiplier: 1.37901,
      physFixed: 255,
      attributeFixed: 139,
      triggers: eonpourExhaustedTriggers,
      variants: [
        {
          id: "hv-peakfall-jadeflush",
          label: "Gauntlet Q - Jadeflush",
          conditions: JADEFLUSH,
          physMultiplier: 0.78782,
          attributeMultiplier: 1.18173,
          physFixed: 218.5,
          attributeFixed: 119,
          castFrames: 52,
        },
      ],
    }),
    hit(1, {
      frame: 35,
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
