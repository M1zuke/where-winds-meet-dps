import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import type { TriggerCondition } from "../../../engine/skill"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const UNLOCKED: TriggerCondition[] = [{ buffId: BUFF.eonpourUnlock, op: "gte", stacks: 1 }]

const stage = (
  index: number,
  frame: number,
  physMultiplier: number,
  physFixed: number,
  attributeFixed: number,
) =>
  hit(index, {
    frame,
    physMultiplier,
    attributeMultiplier: physMultiplier * 1.5,
    physFixed,
    attributeFixed,
    conditions: UNLOCKED,
  })

const finisherThird = (index: number, frame: number) =>
  stage(index, frame, 1.82136 / 3, 505 / 3, 275 / 3)

// The finisher lands three strikes that share its stage total; their split is
// not published, equal thirds are assumed.
export const dragonquenchStagesAt = (frames: readonly number[]) => [
  stage(0, frames[0], 0.68814, 191, 104),
  stage(1, frames[1], 0.66144, 184, 100),
  stage(2, frames[2], 0.80698, 224, 122),
  finisherThird(3, frames[3]),
  finisherThird(4, frames[4]),
  finisherThird(5, frames[5]),
]

export const DRAGONQUENCH_TAGS = [WEAPON.gauntlets, ATTUNE.driftcleaveDeepdaze]
export const DRAGONQUENCH_RECEIVES = [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40]

export const dragonquenchStages = dragonquenchStagesAt([18, 41, 69, 91, 98, 105])

// Forced precision per the talent "Increased Binge Point Gain" rank 2. Cast
// length (the four stages to their earliest next input) and hit frames:
// in-game animation, 2026-09-05.
export const dragonquenchInebriate = defineSkill({
  id: SKILL.dragonquenchInebriate,
  classId: "bamboocutDraught",
  name: "Dragonquench - Inebriate",
  tags: DRAGONQUENCH_TAGS,
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.dragonquenchInebriate,
  neverAbrades: true,
  receives: DRAGONQUENCH_RECEIVES,
  triggerable: false,
  castFrames: 143,
  hits: dragonquenchStages,
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
