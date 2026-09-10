import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SPEARSPECIAL_HITS } from "./spearspecial-hits"

export const spearspecial1HitCancel = defineSkill({
  id: SKILL.spearspecial1HitCancel,
  classId: "bellstrikeUmbra",
  name: "Spear Special (1 Hit Cancel)",
  breakdownName: "Sweep All",
  tags: [WEAPON.spear, ATTACK.heavy, ATTUNE.spearSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearSpecial1HitCancel,
  // A cancel form ends where the animation opens its interrupt window — 35 frames in (in-game animation, 2026-09-09); the parry that ends it is the next rotation step.
  castFrames: 35,
  triggerable: true,
  hits: SPEARSPECIAL_HITS.slice(0, 1),
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
