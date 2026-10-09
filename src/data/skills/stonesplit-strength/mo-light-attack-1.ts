import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const moLightAttack1 = defineSkill({
  id: SKILL.moLightAttack1,
  classId: "stonesplitStrength",
  name: "Mo Blade - Light Attack (1st Stage)",
  breakdownName: "Mo Blade - Light Attack",
  tags: [WEAPON.moBlade, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.moLightAttack1,
  receives: [BUFF.swallowcallLightAttackBoost, ...PHALANXBANE_BLADE_RECEIVES],
  triggersBuffs: [],
  castFrames: 38,
  triggerable: true,
  reachMeters: 4.5,
  displacement: {
    kind: "byDistance",
    bands: [{ minMeters: 1, maxMeters: 4, then: { kind: "toTarget", meters: 1.5 } }],
    otherwise: { kind: "towardTarget", referenceMeters: 1 },
  },
  hits: [
    hit(0, {
      frame: 17,
      physMultiplier: 0.763704,
      attributeMultiplier: 1.145556,
      physFixed: 211.2,
      attributeFixed: 115.2,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
