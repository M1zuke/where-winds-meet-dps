import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import { DRAGONQUENCH_RECEIVES, DRAGONQUENCH_TAGS } from "./dragonquench-inebriate"
import { dragonquenchSecondStages } from "./dragonquench-inebriate-second"

// A cancel form ends where the animation opens its interrupt window — 35
// frames into the finisher (in-game animation, 2026-09-06); the parry that
// ends it is the next rotation step.
export const dragonquenchInebriateSecondCancel = defineSkill({
  id: SKILL.dragonquenchInebriateSecondCancel,
  classId: "bamboocutDraught",
  name: "Dragonquench - Inebriate (2nd combo) [cancel]",
  breakdownName: "Dragonquench - Inebriate",
  tags: DRAGONQUENCH_TAGS,
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.dragonquenchInebriateSecondCancel,
  guaranteedPrecision: true,
  receives: DRAGONQUENCH_RECEIVES,
  triggerable: false,
  castFrames: 101,
  hits: dragonquenchSecondStages,
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
