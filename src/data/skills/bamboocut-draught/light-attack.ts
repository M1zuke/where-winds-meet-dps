import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import {
  CLASS_RECEIVES,
  MISTWILLOW_LIGHT_ATTACK_RECEIVES,
  SKYSTRIKE_GAUNTLETS_RECEIVES,
} from "./receives"
import {
  lightAttackMarkTriggers,
  lightAttackStageFiveSecondColliderTriggers,
} from "./buffs/lightAttackMarks"
import type { LevelRows } from "../../../engine/skill"
import { LEVEL_ROWS } from "./levelRows"

const stage = (index: number, frame: number, levelRows: LevelRows, closesChain = false) =>
  hit(index, {
    frame,
    ...levelScaled(levelRows),
    triggers: closesChain
      ? [...lightAttackMarkTriggers(true), castSkill({ target: SKILL.falconsPursuit })]
      : lightAttackMarkTriggers(),
  })

// The chain Skystrike Gauntlets plays outside Inebriate: six stages, stages 2
// and 5 landing twice; the sixth unleashes Falcon's Pursuit. In-game values
// as of 2026-09-16.
export const lightAttack = defineSkill({
  id: SKILL.lightAttack,
  classId: "bamboocutDraught",
  name: "Gauntlet Light Attack",
  breakdownName: "Gauntlets Light Attack",
  tags: [WEAPON.gauntlets, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.lightAttack,
  receives: [
    BUFF.swallowcallLightAttackBoost,
    ...CLASS_RECEIVES,
    ...SKYSTRIKE_GAUNTLETS_RECEIVES,
    ...MISTWILLOW_LIGHT_ATTACK_RECEIVES,
  ],
  triggerable: false,
  castFrames: 187,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    stage(0, 17, LEVEL_ROWS.lightAttackHit0),
    stage(1, 37, LEVEL_ROWS.lightAttackHit1),
    hit(2, {
      frame: 47,
      ...levelScaled(LEVEL_ROWS.lightAttackHit2),
      triggers: [],
    }),
    stage(3, 71, LEVEL_ROWS.lightAttackHit3),
    stage(4, 87, LEVEL_ROWS.lightAttackHit4),
    stage(5, 113, LEVEL_ROWS.lightAttackHit5),
    hit(6, {
      frame: 126,
      ...levelScaled(LEVEL_ROWS.lightAttackHit6),
      triggers: lightAttackStageFiveSecondColliderTriggers,
    }),
    stage(7, 147, LEVEL_ROWS.lightAttackHit7, true),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
