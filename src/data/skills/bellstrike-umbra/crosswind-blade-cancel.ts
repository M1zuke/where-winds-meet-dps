import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CROSSWIND_BLADE_HITS } from "./crosswind-blade-hits"

export const crosswindBladeCancel = defineSkill({
  id: SKILL.crosswindBladeCancel,
  classId: "bellstrikeUmbra",
  name: "Crosswind Blade [cancel]",
  breakdownName: "Crisscross - Inner Balance III",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.crosswindBladeCancel,
  // A cancel form ends where the animation opens its interrupt window — 35 frames in (in-game animation, 2026-09-09); the parry that ends it is the next rotation step.
  castFrames: 35,
  triggerable: true,
  hits: CROSSWIND_BLADE_HITS.slice(0, 1),
  createdAt: "2026-09-09T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
