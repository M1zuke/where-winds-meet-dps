import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CROSSWIND_BLADE_HITS } from "./crosswind-blade-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

export const crosswindBlade = defineSkill({
  id: SKILL.crosswindBlade,
  classId: "bellstrikeUmbra",
  name: "Crosswind Blade",
  breakdownName: "Crisscross - Inner Balance III",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.crosswindBlade,
  receives: STRATEGIC_SWORD_RECEIVES,
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 57,
  triggerable: true,
  hits: CROSSWIND_BLADE_HITS,
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
