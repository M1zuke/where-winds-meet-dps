import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { eonpourExhaustedTriggers } from "./buffs/eonpourExhausted"
import { skillBingePointAccumulationTriggers } from "./buffs/skillBingePointAccumulation"

const JADEFLUSH = [{ buffId: STATUS.bingePoints, op: "gte" as const, stacks: 100 }]
// In-game values as of 2026-09-16.
const REQUIRES_CONSECUTIVE_PUNCHES = [
  { buffId: STATUS.consecutivePunches, op: "gte" as const, stacks: 1 },
]
const REQUIRES_COOLDOWN_CLEAR = [{ buffId: STATUS.castlinkCooldown, op: "eq" as const, stacks: 0 }]

const jadeflushKick = {
  id: "hv-castlink-jadeflush",
  label: "Jadeflush",
  conditions: JADEFLUSH,
  physMultiplier: 0.635355,
  attributeMultiplier: 0.9530325,
  physFixed: 176,
  attributeFixed: 95.75,
}

// Shares Peakfall's Eonpour tier-6 Exhausted trigger and its 60 s cooldown
// (in-game text of the trigger's own cooldown state, 2026-09-06). Cast length
// to the earliest next input and hit frames: in-game animation, 2026-09-24.
export const castlink = defineSkill({
  id: SKILL.castlink,
  classId: "bamboocutDraught",
  name: "Castlink",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsMartialArt, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.castlink,
  receives: [
    ...INEBRIATE_ENHANCED_RECEIVES,
    ...SKYSTRIKE_GAUNTLETS_RECEIVES,
    BUFF.nonPlayerBaseDamage40,
  ],
  triggersBuffs: [BUFF.jadeware],
  triggerable: false,
  castFrames: 49,
  // In-game values as of 2026-09-28: 18 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 18,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 15,
      physMultiplier: 0.616165,
      attributeMultiplier: 0.9242475,
      physFixed: 171,
      attributeFixed: 93,
      conditions: [...REQUIRES_CONSECUTIVE_PUNCHES, ...REQUIRES_COOLDOWN_CLEAR],
      triggers: [
        ...eonpourExhaustedTriggers,
        applyBuff({ target: STATUS.consecutivePunches, stacks: -1 }),
        applyBuff({ target: STATUS.castlinkCooldown, stacks: 1 }),
      ],
      variants: [{ ...jadeflushKick, castFrames: 89 }],
    }),
    hit(1, {
      frame: 27,
      physMultiplier: 0.616165,
      attributeMultiplier: 0.9242475,
      physFixed: 171,
      attributeFixed: 93,
      conditions: [...REQUIRES_CONSECUTIVE_PUNCHES, ...REQUIRES_COOLDOWN_CLEAR],
      triggers: skillBingePointAccumulationTriggers,
      variants: [jadeflushKick],
    }),
    hit(2, {
      frame: 41,
      physMultiplier: 0.635355,
      attributeMultiplier: 0.9530325,
      physFixed: 176,
      attributeFixed: 95.75,
      conditions: [...JADEFLUSH, ...REQUIRES_CONSECUTIVE_PUNCHES, ...REQUIRES_COOLDOWN_CLEAR],
    }),
    hit(3, {
      frame: 74,
      physMultiplier: 0.635355,
      attributeMultiplier: 0.9530325,
      physFixed: 176,
      attributeFixed: 95.75,
      conditions: [...JADEFLUSH, ...REQUIRES_CONSECUTIVE_PUNCHES, ...REQUIRES_COOLDOWN_CLEAR],
      triggers: skillBingePointAccumulationTriggers,
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
