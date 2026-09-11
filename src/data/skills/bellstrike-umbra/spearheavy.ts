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
  castFrames: 90,
  triggerable: true,
  hits: [
    // Hit frame: in-game animation, 2026-09-09. Coefficients: in-game
    // values, 2026-09-10.
    hit(0, {
      frame: 25,
      physMultiplier: 1.250878,
      attributeMultiplier: 1.876317,
      physFixed: 346,
      attributeFixed: 188.6,
    }),
    // Hits 2-5 are unmeasured: evenly-spaced placeholders, not observed frames.
    hit(1, {
      frame: 18,
      physMultiplier: 0.750527,
      attributeMultiplier: 1.12579,
      physFixed: 207.6,
      attributeFixed: 113.16,
    }),
    hit(2, {
      frame: 36,
      physMultiplier: 0.375263,
      attributeMultiplier: 0.562895,
      physFixed: 103.8,
      attributeFixed: 56.58,
    }),
    hit(3, {
      frame: 54,
      physMultiplier: 1.250878,
      attributeMultiplier: 1.876317,
      physFixed: 346,
      attributeFixed: 188.6,
    }),
    hit(4, {
      frame: 72,
      physMultiplier: 0.331483,
      attributeMultiplier: 0.497224,
      physFixed: 91.69,
      attributeFixed: 49.98,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
})
