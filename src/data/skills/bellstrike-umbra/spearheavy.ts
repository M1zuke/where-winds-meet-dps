import { defineSkill, hit } from "../../../definitions/skills/skillDef"
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
  hits: [
    // Hit frame: in-game animation, 2026-09-09.
    hit(0, { frame: 25, physMultiplier: 0.30346, attributeMultiplier: 0.45518000000000003, physFixed: 70.2, attributeFixed: 39.2 }),
    // Hits 2-5: the animations they belong to carry no collider data — frames still evenly-spaced placeholders.
    hit(1, { frame: 18, physMultiplier: 0.30346, attributeMultiplier: 0.45518000000000003, physFixed: 70.2, attributeFixed: 39.2 }),
    hit(2, { frame: 36, physMultiplier: 0.30346, attributeMultiplier: 0.45518000000000003, physFixed: 70.2, attributeFixed: 39.2 }),
    hit(3, { frame: 54, physMultiplier: 0.30346, attributeMultiplier: 0.45518000000000003, physFixed: 70.2, attributeFixed: 39.2 }),
    hit(4, { frame: 72, physMultiplier: 0.30346, attributeMultiplier: 0.45518000000000003, physFixed: 70.2, attributeFixed: 39.2 }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
