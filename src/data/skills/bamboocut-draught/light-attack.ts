import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
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
  physMultiplier: number,
  physFixed: number,
  attributeFixed: number,
  carousePoints: number,
) =>
  hit(index, {
    frame: -1,
    physMultiplier,
    attributeMultiplier: physMultiplier * 1.5,
    physFixed,
    attributeFixed,
    triggers: onLanding(carousePoints),
  })

// Coefficients: client skill_numerical_config rows 20902011-20902016 at skill
// level 100 (patch container, 2026-09-04), one hit per stage; Bloombreak, the
// Inebriate form, shares them. Each landing grants 2 Binge Marks, 5 during
// Carouse, and during Carouse 3 Binge Points, 5 on the sixth. The sixth hit
// unleashes Falcon's Pursuit, row 20902814 (1.4784), carried as one hit.
export const lightAttack = defineSkill({
  id: SKILL.lightAttack,
  classId: "bamboocutDraught",
  name: "Light Attack",
  breakdownName: "Gauntlets Light Attack",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.lightAttack,
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: -1,
  hits: [
    stage(0, 0.34392, 96, 52, 3),
    stage(1, 0.22728, 64, 35, 3),
    stage(2, 0.36725, 103, 56, 3),
    stage(3, 0.32992, 92, 50, 3),
    stage(4, 0.46445, 130, 70, 3),
    stage(5, 0.65496, 182, 99, 5),
    hit(6, {
      frame: -1,
      physMultiplier: 1.4784,
      attributeMultiplier: 2.2176,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
