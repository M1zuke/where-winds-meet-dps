import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { CROSSWIND_BLADE_HITS } from "./crosswind-blade-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

export const crosswindBladeCancel = defineSkill({
  id: SKILL.crosswindBladeCancel,
  classId: "bellstrikeUmbra",
  name: "Crosswind Blade [cancel]",
  breakdownName: "Crisscross - Inner Balance III",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.crosswindBladeCancel,
  // In-game values as of 2026-09-24: only castable with Sword Horizon slotted.
  castConditions: [{ param: PARAM.swordHorizon }],
  receives: STRATEGIC_SWORD_RECEIVES,
  // A cancel form ends where the animation opens its interrupt window — 18 frames in (in-game animation, 2026-09-24); the parry that ends it is the next rotation step.
  castFrames: 18,
  triggerable: true,
  hits: CROSSWIND_BLADE_HITS.slice(0, 1),
  createdAt: "2026-09-09T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
