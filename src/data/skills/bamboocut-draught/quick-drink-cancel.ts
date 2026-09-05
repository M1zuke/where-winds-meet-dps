import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES } from "./receives"
import { perfectQuickDrinkHit } from "./quick-drink"

// A cancel form ends one frame after its last landed effect, here the
// falcon launch; the parry that ends it is the next rotation step.
export const quickDrinkCancel = defineSkill({
  id: SKILL.quickDrinkCancel,
  classId: "bamboocutDraught",
  name: "Gauntlet - Perfect Quick Drink [cancel]",
  breakdownName: "Whaledraft",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.quickDrinkCancel,
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: 19,
  hits: [perfectQuickDrinkHit],
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
