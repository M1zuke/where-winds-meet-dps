import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06. The second collider is listed twice, at
// frames 87 and 98; the earlier entry is used.
export const moLightAttack3 = defineSkill({
  id: SKILL.moLightAttack3,
  classId: "stonesplitStrength",
  name: "Mo Blade - Light Attack (3rd Stage)",
  breakdownName: "Mo Blade - Light Attack",
  tags: [WEAPON.moBlade, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.moLightAttack3,
  receives: [BUFF.swallowcallLightAttackBoost, ...PHALANXBANE_BLADE_RECEIVES],
  triggersBuffs: [],
  castFrames: 142,
  triggerable: true,
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 44,
      physMultiplier: 0.95463,
      attributeMultiplier: 1.431945,
      physFixed: 264,
      attributeFixed: 144,
    }),
    hit(1, {
      frame: 87,
      physMultiplier: 1.145556,
      attributeMultiplier: 1.718334,
      physFixed: 316.8,
      attributeFixed: 172.8,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
