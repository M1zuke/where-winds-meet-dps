import { defineSkill, evenlySpacedHits } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const spearheavy = defineSkill({
  id: SKILL.spearheavy,
  classId: "bellstrikeUmbra",
  name: "SpearHeavy",
  breakdownName: "Drifting Thrust",
  tags: [WEAPON.spear, ATTACK.heavy, ATTUNE.spearCharged],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearHeavy,
  triggersBuffs: [BUFF.soulShaken],
  receives: [BUFF.mistwillowLightBuff, BUFF.mistwillowBuff],
  castFrames: 90,
  triggerable: true,
  hits: evenlySpacedHits({
    count: 5,
    everyFrames: 18,
    physMultiplier: 0.30346,
    attributeMultiplier: 0.45518000000000003,
    physFixed: 70.2,
    attributeFixed: 39.2,
  }),
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
