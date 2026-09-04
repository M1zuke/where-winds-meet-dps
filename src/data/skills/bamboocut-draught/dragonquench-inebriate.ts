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

export const dragonquenchStages = [
  stage(0, 0, 0.68814, 191, 104),
  stage(1, 30, 0.66144, 184, 100),
  stage(2, 60, 0.80698, 224, 122),
  stage(3, 90, 1.82136, 505, 275),
]

// Forced precision per the talent "Increased Binge Point Gain" rank 2. Cast
// length: community speed-rotation workbook v2.0, 2026-09-04, 2.5 s; hit
// spacing provisional.
export const dragonquenchInebriate = defineSkill({
  id: SKILL.dragonquenchInebriate,
  classId: "bamboocutDraught",
  name: "Dragonquench - Inebriate",
  tags: [WEAPON.gauntlets, ATTUNE.driftcleaveDeepdaze],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.dragonquenchInebriate,
  guaranteedPrecision: true,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggerable: false,
  castFrames: 150,
  hits: dragonquenchStages,
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
