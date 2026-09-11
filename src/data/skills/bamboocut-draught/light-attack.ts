import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill } from "../../../definitions/skills/triggers"
import type { HitTrigger } from "../../../engine/skill"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"

const inCarouse = [{ buffId: STATUS.carouse, op: "gte" as const, stacks: 1 }]
const eonpourLightAttackPoints = [
  { buffId: BUFF.eonpourLightAttackPoints, op: "gte" as const, stacks: 1 },
]
const eonpourCarouseTier4 = [
  { buffId: STATUS.carouse, op: "gte" as const, stacks: 1 },
  { buffId: BUFF.eonpourCarousePoints, op: "gte" as const, stacks: 1 },
]

const onLanding = (): HitTrigger[] => [
  applyBuff({ target: STATUS.bingeMarks, stacks: 2 }),
  applyBuff({ target: STATUS.bingeMarks, stacks: 3, conditions: inCarouse }),
]

// Only the stage that closes the chain pays Binge Points, and Eonpour's
// Carouse rung pays a second helping on top of the first.
const onChainEnd = (): HitTrigger[] => [
  ...onLanding(),
  applyBuff({ target: STATUS.bingePoints, stacks: 5, conditions: eonpourLightAttackPoints }),
  applyBuff({ target: STATUS.bingePoints, stacks: 5, conditions: eonpourCarouseTier4 }),
]

const stage = (
  index: number,
  frame: number,
  physMultiplier: number,
  physFixed: number,
  attributeFixed: number,
  triggers: HitTrigger[],
) =>
  hit(index, {
    frame,
    physMultiplier,
    attributeMultiplier: physMultiplier * 1.5,
    physFixed,
    attributeFixed,
    triggers,
  })

// One hit per stage, the six played back to back; Bloombreak, the Inebriate
// form, shares the coefficients. Each landing grants 2 Binge Marks, 5 during
// Carouse, and the sixth stage closes the chain and unleashes Falcon's Pursuit.
export const lightAttack = defineSkill({
  id: SKILL.lightAttack,
  classId: "bamboocutDraught",
  name: "Gauntlet Light Attack",
  breakdownName: "Gauntlets Light Attack",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.lightAttack,
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: 154,
  hits: [
    stage(0, 12, 0.34392, 96, 52, onLanding()),
    stage(1, 35, 0.22728, 64, 35, onLanding()),
    stage(2, 60, 0.36725, 103, 56, onLanding()),
    stage(3, 84, 0.32992, 92, 50, onLanding()),
    stage(4, 108, 0.46445, 130, 70, onLanding()),
    stage(5, 131, 0.65496, 182, 99, [...onChainEnd(), castSkill({ target: SKILL.falconsPursuit })]),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
