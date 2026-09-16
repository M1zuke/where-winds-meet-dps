import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SPEARSPECIAL_HITS } from "./spearspecial-hits"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"

export const spearspecial = defineSkill({
  id: SKILL.spearspecial,
  classId: "bellstrikeUmbra",
  name: "Spear Special",
  breakdownName: "Sweep All",
  tags: [WEAPON.spear, ATTACK.heavy, ATTUNE.spearSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearSpecial,
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 102,
  triggerable: true,
  hits: SPEARSPECIAL_HITS,
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
