import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import {
  DRAGONQUENCH_RECEIVES,
  DRAGONQUENCH_TAGS,
  dragonquenchStages,
} from "./dragonquench-inebriate"

// A cancel form ends where the animation opens its interrupt window — 40
// frames into the finisher, after its last strike (in-game animation,
// 2026-09-06); the parry that ends it is the next rotation step.
export const dragonquenchInebriateCancel = defineSkill({
  id: SKILL.dragonquenchInebriateCancel,
  classId: "bamboocutDraught",
  name: "Dragonquench - Inebriate [cancel]",
  breakdownName: "Dragonquench - Inebriate",
  tags: DRAGONQUENCH_TAGS,
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.dragonquenchInebriateCancel,
  neverAbrades: true,
  receives: DRAGONQUENCH_RECEIVES,
  triggerable: false,
  castFrames: 116,
  hits: dragonquenchStages,
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
