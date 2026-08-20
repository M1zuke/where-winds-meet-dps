import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// The reference JSON zeroes every coefficient on this cast — unlike UmbQ
// Prepull, which carries UmbQ's real numbers. Left at zero rather than
// overwritten from the workbook's "Fan Q" row: this step's only combat effect
// is the pre-pull `triggersBuffs`, and `prePullHitsCount: false` on every
// rotation that casts it excludes pre-pull damage from the total regardless.
export const fanqPrepull = defineSkill({
  id: SKILL.fanqPrepull,
  classId: "silkbindJade",
  name: "FanQ Prepull",
  tags: [PROP.isMartialSkillQ, WEAPON.fan, ATTUNE.fanQ],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanQPrepull,
  triggersBuffs: [BUFF.jadeware, BUFF.windWall, BUFF.windWallPursuit, BUFF.springThunder],
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      extraCritDamage: 0,
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
