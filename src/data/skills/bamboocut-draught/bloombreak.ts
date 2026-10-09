import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import type { TriggerCondition } from "../../../engine/skill"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { lightAttackMarkTriggers } from "./buffs/lightAttackMarks"

const INEBRIATE: TriggerCondition[] = [{ buffId: STATUS.bingePoints, op: "gte", stacks: 100 }]

const stage = (
  index: number,
  frame: number,
  physMultiplier: number,
  physFixed: number,
  attributeFixed: number,
  closesChain = false,
) =>
  hit(index, {
    frame,
    physMultiplier,
    attributeMultiplier: physMultiplier * 1.5,
    physFixed,
    attributeFixed,
    conditions: INEBRIATE,
    triggers: lightAttackMarkTriggers(closesChain),
  })

// The Inebriate light-attack chain of Skystrike Gauntlets: six stages, no
// Falcon's Pursuit on any of them (in-game values as of 2026-09-16). Coefficients
// at skill level 100 (in-game damage tooltip, 2026-09-05).
export const bloombreak = defineSkill({
  id: SKILL.bloombreak,
  classId: "bamboocutDraught",
  name: "Gauntlet Light Attack - Inebriate",
  breakdownName: "Bloombreak",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.bloombreak,
  receives: [BUFF.swallowcallLightAttackBoost, ...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  triggerable: false,
  castFrames: 154,
  hits: [
    stage(0, 12, 0.34392, 96, 52),
    stage(1, 35, 0.22728, 64, 35),
    stage(2, 60, 0.36725, 103, 56),
    stage(3, 84, 0.32992, 92, 50),
    stage(4, 108, 0.46445, 130, 70),
    stage(5, 131, 0.65496, 182, 99, true),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
