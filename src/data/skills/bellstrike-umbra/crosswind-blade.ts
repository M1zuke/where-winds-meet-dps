import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { CROSSWIND_BLADE_HITS } from "./crosswind-blade-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

export const crosswindBlade = defineSkill({
  id: SKILL.crosswindBlade,
  classId: "bellstrikeUmbra",
  name: "Crosswind Blade",
  breakdownName: "Crisscross - Inner Balance III",
  // In-game values as of 2026-09-24: the Special attunement reaches
  // Crisscross - Inner Balance III too.
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.crosswindBlade,
  // In-game values as of 2026-09-24: only castable with Sword Horizon slotted.
  castConditions: [{ param: PARAM.swordHorizon }],
  receives: STRATEGIC_SWORD_RECEIVES,
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 57,
  triggerable: true,
  hits: CROSSWIND_BLADE_HITS,
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
