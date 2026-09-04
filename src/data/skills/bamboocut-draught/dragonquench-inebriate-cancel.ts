import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"
import { dragonquenchStages } from "./dragonquench-inebriate"

// Cast length: community speed-rotation workbook v2.0, 2026-09-04, 2.0 s.
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
  castFrames: 120,
  hits: dragonquenchStages,
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
