import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06.
export const moLightAttack2 = defineSkill({
  id: SKILL.moLightAttack2,
  classId: "stonesplitStrength",
  name: "Mo Blade - Light Attack (2nd Stage)",
  breakdownName: "Mo Blade - Light Attack",
  tags: [WEAPON.moBlade, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.moLightAttack2,
  receives: [BUFF.swallowcallLightAttackBoost, ...PHALANXBANE_BLADE_RECEIVES],
  triggersBuffs: [],
  castFrames: 65,
  triggerable: true,
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 43,
      ...levelScaled(LEVEL_ROWS.moLightAttack2Hit0),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
