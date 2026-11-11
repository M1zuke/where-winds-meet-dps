import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import type { LevelRows, TriggerCondition } from "../../../engine/skill"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import {
  CLASS_RECEIVES,
  MISTWILLOW_LIGHT_ATTACK_RECEIVES,
  SKYSTRIKE_GAUNTLETS_RECEIVES,
} from "./receives"
import { lightAttackMarkTriggers } from "./buffs/lightAttackMarks"
import { LEVEL_ROWS } from "./levelRows"

const INEBRIATE: TriggerCondition[] = [{ buffId: STATUS.bingePoints, op: "gte", stacks: 100 }]

const stage = (index: number, frame: number, levelRows: LevelRows, closesChain = false) =>
  hit(index, {
    frame,
    ...levelScaled(levelRows),
    conditions: INEBRIATE,
    triggers: lightAttackMarkTriggers(closesChain),
  })

// The Inebriate light-attack chain of Skystrike Gauntlets: six stages, no
// Falcon's Pursuit on any of them (in-game values as of 2026-09-16).
export const bloombreak = defineSkill({
  id: SKILL.bloombreak,
  classId: "bamboocutDraught",
  name: "Gauntlet Light Attack - Inebriate",
  breakdownName: "Bloombreak",
  tags: [WEAPON.gauntlets, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.bloombreak,
  receives: [
    BUFF.swallowcallLightAttackBoost,
    ...CLASS_RECEIVES,
    ...SKYSTRIKE_GAUNTLETS_RECEIVES,
    ...MISTWILLOW_LIGHT_ATTACK_RECEIVES,
  ],
  triggerable: false,
  castFrames: 154,
  hits: [
    stage(0, 14, LEVEL_ROWS.bloombreakHit0),
    stage(1, 35, LEVEL_ROWS.bloombreakHit1),
    stage(2, 60, LEVEL_ROWS.bloombreakHit2),
    stage(3, 84, LEVEL_ROWS.bloombreakHit3),
    stage(4, 108, LEVEL_ROWS.bloombreakHit4),
    stage(5, 131, LEVEL_ROWS.bloombreakHit5, true),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
