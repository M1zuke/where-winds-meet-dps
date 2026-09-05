import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill } from "../../../definitions/skills/triggers"
import type { HitTrigger } from "../../../engine/skill"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"

const inCarouse = [{ buffId: STATUS.carouse, op: "gte" as const, stacks: 1 }]

const onLanding = (carousePoints: number): HitTrigger[] => [
  applyBuff({ target: STATUS.bingeMarks, stacks: 2 }),
  applyBuff({ target: STATUS.bingeMarks, stacks: 3, conditions: inCarouse }),
  applyBuff({ target: STATUS.bingePoints, stacks: carousePoints, conditions: inCarouse }),
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

// Coefficients: client skill_numerical_config rows 20902011-20902016 at skill
// level 100 (patch container, 2026-09-04), one hit per stage; Bloombreak, the
// Inebriate form, shares them. Each landing grants 2 Binge Marks, 5 during
// Carouse, and during Carouse 3 Binge Points, 5 on the sixth, which also
// unleashes Falcon's Pursuit. Cast length and hit frames: in-game animation,
// 2026-09-05, the six stages played back to back.
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
    stage(0, 12, 0.34392, 96, 52, onLanding(3)),
    stage(1, 35, 0.22728, 64, 35, onLanding(3)),
    stage(2, 60, 0.36725, 103, 56, onLanding(3)),
    stage(3, 84, 0.32992, 92, 50, onLanding(3)),
    stage(4, 108, 0.46445, 130, 70, onLanding(3)),
    stage(5, 131, 0.65496, 182, 99, [...onLanding(5), castSkill({ target: SKILL.falconsPursuit })]),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
