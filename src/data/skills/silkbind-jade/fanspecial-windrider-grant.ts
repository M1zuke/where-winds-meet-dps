import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"

export const fanspecialWindriderGrant = defineSkill({
  id: SKILL.fanspecialWindriderGrant,
  classId: "silkbindJade",
  name: "FanSpecial (Windrider)",
  breakdownName: "Peak's Springless Silence",
  tags: [WEAPON.fan],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanSpecialWindriderGrant,
  receives: [...INKWELL_FAN_RECEIVES],
  triggersBuffs: [BUFF.windrider],
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
