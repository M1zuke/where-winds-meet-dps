import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const JADEFLUSH = [{ buffId: STATUS.bingePoints, op: "gte" as const, stacks: 100 }]

const EONPOUR_EXHAUSTED = {
  conditions: [{ buffId: BUFF.eonpourExhaustedPeakfall, op: "gte" as const, stacks: 1 }],
  phase: "exhausted" as const,
  cooldownFrames: 3600,
}

// With Eonpour at tier 6, hitting an Exhausted target — read as the Qi-break
// window — inflicts Wildstride, Strayhunt and Drunkslay and extends Deepdaze
// by 6 s or enters it, once per 60 s.
// Cast length: community speed-rotation workbook v2.0, 2026-09-04 — 0.7 s
// plain, 0.9 s Jadeflush; hit spacing provisional.
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
  castFrames: 42,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.91934,
      attributeMultiplier: 1.37901,
      physFixed: 255,
      attributeFixed: 139,
      triggers: [
        applyDebuff({ target: DEBUFF.wildstride, stacks: 1, ...EONPOUR_EXHAUSTED }),
        applyDebuff({ target: DEBUFF.strayhunt, stacks: 1, ...EONPOUR_EXHAUSTED }),
        applyDebuff({ target: DEBUFF.drunkslay, stacks: 1, ...EONPOUR_EXHAUSTED }),
        applyBuff({
          target: STATUS.inebriateDeepdaze,
          stacks: 1,
          extendFrames: 360,
          ...EONPOUR_EXHAUSTED,
        }),
      ],
      variants: [
        {
          id: "hv-peakfall-jadeflush",
          label: "Gauntlet Q - Jadeflush",
          conditions: JADEFLUSH,
          physMultiplier: 0.78782,
          attributeMultiplier: 1.18173,
          physFixed: 218.5,
          attributeFixed: 119,
          castFrames: 54,
        },
      ],
    }),
    hit(1, {
      frame: 27,
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
