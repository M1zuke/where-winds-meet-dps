import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON, PROP } from "../ids"
import { SKILL } from "./ids"

export const fanHeavyPursuit3Hit = defineSkill({
  id: SKILL.fanHeavyPursuit3Hit,
  classId: "silkbindJade",
  name: "FanHeavyPursuit 3-Hit",
  abilityTag: "FanHeavyPursuit 3-Hit",
  tags: [
    PROP.isExecution,
    PROP.hasLowQiCritBoost,
    PROP.hasLowQiDmgBoost,
    WEAPON.fan,
    ATTACK.heavy,
    ATTUNE.fanSpecial,
    "role:fanHeavyPursuit",
  ],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanHeavyPursuit3Hit,
  castFrames: 90,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.4157666666666667,
      attributeMultiplier: 0.6236333333333334,
      physFixed: 96.33333333333333,
      attributeFixed: 53.666666666666664,
      extraCritDamage: 1,
      triggers: [],
    }),
    hit(1, {
      frame: 30,
      physMultiplier: 0.4157666666666667,
      attributeMultiplier: 0.6236333333333334,
      physFixed: 96.33333333333333,
      attributeFixed: 53.666666666666664,
      extraCritDamage: 1,
      triggers: [],
    }),
    hit(2, {
      frame: 60,
      physMultiplier: 0.4157666666666667,
      attributeMultiplier: 0.6236333333333334,
      physFixed: 96.33333333333333,
      attributeFixed: 53.666666666666664,
      extraCritDamage: 1,
      triggers: [],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})