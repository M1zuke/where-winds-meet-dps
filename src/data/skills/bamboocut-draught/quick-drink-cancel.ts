import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES } from "./receives"
import { perfectQuickDrinkHit } from "./quick-drink"

// A cancel form ends where the animation clears its input buffer — 24
// frames in, after the falcon launch (in-game animation, 2026-09-06); the
// parry that ends it is the next rotation step.
export const quickDrinkCancel = defineSkill({
  id: SKILL.quickDrinkCancel,
  classId: "bamboocutDraught",
  name: "Gauntlet - Perfect Quick Drink [cancel]",
  breakdownName: "Whaledraft (Drink)",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.quickDrinkCancel,
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: 24,
  hits: [perfectQuickDrinkHit],
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
