import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import { DRAGONQUENCH_RECEIVES, DRAGONQUENCH_TAGS } from "./dragonquench-inebriate"
import { dragonquenchThirdStages } from "./dragonquench-inebriate-third"

// A cancel form ends where the animation opens its interrupt window — 31
// frames into the finisher (in-game animation, 2026-09-06); the parry that
// ends it is the next rotation step.
export const dragonquenchInebriateThirdCancel = defineSkill({
  id: SKILL.dragonquenchInebriateThirdCancel,
  classId: "bamboocutDraught",
  name: "Dragonquench - Inebriate (3rd combo) [cancel]",
  breakdownName: "Dragonquench - Inebriate",
  tags: DRAGONQUENCH_TAGS,
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.dragonquenchInebriateThirdCancel,
  neverAbrades: true,
  receives: DRAGONQUENCH_RECEIVES,
  triggerable: false,
  castFrames: 89,
  hits: dragonquenchThirdStages,
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
