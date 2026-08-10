import { defineSkill, hit } from "../define"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const spearheavy1HitPrepull = defineSkill({
  id: SKILL.spearheavy1HitPrepull,
  classId: "bellstrikeUmbra",
  name: "SpearHeavy 1-Hit Prepull",
  tags: [WEAPON.spear, ATTACK.heavy, ATTUNE.spearCharged],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearHeavy1HitPrepull,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, { frame: 0, physMultiplier: 0.30346, attributeMultiplier: 0.45518, physFixed: 70.2, attributeFixed: 39.2 }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
