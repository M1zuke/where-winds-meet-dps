import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06.
export const hengLightAttack4 = defineSkill({
  id: SKILL.hengLightAttack4,
  classId: "stonesplitStrength",
  name: "Heng Blade - Light Attack (4th Stage)",
  breakdownName: "Heng Blade - Light Attack",
  tags: [WEAPON.hengBlade, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.hengLightAttack4,
  receives: [BUFF.swallowcallLightAttackBoost, ...SNOWPARTING_BLADE_RECEIVES],
  triggersBuffs: [],
  castFrames: 57,
  triggerable: true,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 11,
      ...levelScaled(LEVEL_ROWS.hengLightAttack4Hit0),
    }),
    hit(1, {
      frame: 38,
      ...levelScaled(LEVEL_ROWS.hengLightAttack4Hit1),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
