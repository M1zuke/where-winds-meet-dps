import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import {
  DRAGONQUENCH_DISPLACEMENT,
  DRAGONQUENCH_REACH_METERS,
  DRAGONQUENCH_RECEIVES,
  DRAGONQUENCH_TAGS,
  dragonquenchStagesAt,
} from "./dragonquench-inebriate"

export const dragonquenchSecondStages = dragonquenchStagesAt([16, 36, 60, 79, 85, 91])

// The second combo of a Deepdaze plays 15 % faster. Cast length (the four
// stages to their earliest next input) and hit frames: in-game animation,
// 2026-09-24.
export const dragonquenchInebriateSecond = defineSkill({
  id: SKILL.dragonquenchInebriateSecond,
  classId: "bamboocutDraught",
  name: "Dragonquench - Inebriate (2nd combo)",
  breakdownName: "Dragonquench - Inebriate",
  tags: DRAGONQUENCH_TAGS,
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.dragonquenchInebriateSecond,
  startLatency: "noWaitOnDummy",
  neverAbrades: true,
  receives: DRAGONQUENCH_RECEIVES,
  triggerable: false,
  castFrames: 124,
  reachMeters: DRAGONQUENCH_REACH_METERS,
  displacement: DRAGONQUENCH_DISPLACEMENT,
  hits: dragonquenchSecondStages,
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
