import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import {
  DRAGONQUENCH_RECEIVES,
  DRAGONQUENCH_TAGS,
  dragonquenchStagesAt,
} from "./dragonquench-inebriate"

export const dragonquenchThirdStages = dragonquenchStagesAt([14, 32, 54, 71, 76, 81])

// The third combo of a Deepdaze plays 30 % faster. Cast length (the four
// stages to their earliest next input) and hit frames: in-game animation,
// 2026-09-05.
export const dragonquenchInebriateThird = defineSkill({
  id: SKILL.dragonquenchInebriateThird,
  classId: "bamboocutDraught",
  name: "Dragonquench - Inebriate (3rd combo)",
  breakdownName: "Dragonquench - Inebriate",
  tags: DRAGONQUENCH_TAGS,
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.dragonquenchInebriateThird,
  neverAbrades: true,
  receives: DRAGONQUENCH_RECEIVES,
  triggerable: false,
  castFrames: 111,
  hits: dragonquenchThirdStages,
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
