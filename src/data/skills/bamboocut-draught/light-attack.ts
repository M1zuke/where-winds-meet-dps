import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import {
  lightAttackMarkTriggers,
  lightAttackStageFiveSecondColliderTriggers,
} from "./buffs/lightAttackMarks"

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
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.lightAttack,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  triggerable: false,
  castFrames: 187,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    stage(0, 13, 0.35636, 100, 54),
    stage(1, 37, 0.156852, 44, 23.6),
    hit(2, {
      frame: 47,
      physMultiplier: 0.235278,
      attributeMultiplier: 0.352917,
      physFixed: 66,
      attributeFixed: 35.4,
      triggers: [],
    }),
    stage(3, 71, 0.25294, 71, 39),
    stage(4, 87, 0.31826, 89, 48),
    stage(5, 113, 0.186944, 52, 28.4),
    hit(6, {
      frame: 126,
      physMultiplier: 0.280416,
      attributeMultiplier: 0.420624,
      physFixed: 78,
      attributeFixed: 42.6,
      triggers: lightAttackStageFiveSecondColliderTriggers,
    }),
    stage(7, 147, 0.8202, 228, 124, true),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
