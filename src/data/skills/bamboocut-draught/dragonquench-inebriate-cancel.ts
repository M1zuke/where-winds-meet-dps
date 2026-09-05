import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"
import { dragonquenchStages } from "./dragonquench-inebriate"

// A cancel form ends one frame after its last landed collider — the
// finisher's fourth collider, 40.5 frames into the stage (in-game animation,
// 2026-09-05); the parry that ends it is the next rotation step.
export const dragonquenchInebriateCancel = defineSkill({
  id: SKILL.dragonquenchInebriateCancel,
  classId: "bamboocutDraught",
  name: "Dragonquench - Inebriate [cancel]",
  breakdownName: "Dragonquench - Inebriate",
  tags: [WEAPON.gauntlets, ATTUNE.driftcleaveDeepdaze],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.dragonquenchInebriateCancel,
  guaranteedPrecision: true,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggerable: false,
  castFrames: 117,
  hits: dragonquenchStages,
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
