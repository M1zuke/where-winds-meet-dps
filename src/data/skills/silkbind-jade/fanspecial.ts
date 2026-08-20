import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const fanSpecial = defineSkill({
  id: SKILL.fanSpecial,
  classId: "silkbindJade",
  name: "FanSpecial",
  abilityTag: "FanSpecial",
  tags: [WEAPON.fan, ATTUNE.fanSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanSpecial,
  // Emerald Barrier (in-game capture, 2026-08-19): grants Jadebreak on release
  // and Windrider at the end of the cast. Both buffs are fan-granted,
  // umbrella-side payload — see `classBuffDefs` in `silkbind-jade/index.ts`.
  triggersBuffs: [BUFF.jadebreak, BUFF.windrider],
  castFrames: 72,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.63965,
      attributeMultiplier: 0.9595,
      physFixed: 148,
      attributeFixed: 83,
      extraCritDamage: 0,
      triggers: [],
    }),
    hit(1, {
      frame: 36,
      physMultiplier: 0.63965,
      attributeMultiplier: 0.9595,
      physFixed: 148,
      attributeFixed: 83,
      extraCritDamage: 0,
      triggers: [],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
