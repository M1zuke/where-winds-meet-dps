import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"

export const fanqcancel = defineSkill({
  id: SKILL.fanqcancel,
  classId: "silkbindJade",
  name: "FanQCancel",
  tags: [PROP.isMartialSkillQ, WEAPON.fan, ATTUNE.fanQ],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanQCancel,
  cancelledBy: "deflectCancel",
  receives: [BUFF.starweaveMartialBoost, ...INKWELL_FAN_RECEIVES],
  triggersBuffs: [BUFF.jadeware, BUFF.windWall, BUFF.springThunder],
  // Cast length to the earliest next input (in-game values as of 2026-09-24;
  // collider + 1).
  castFrames: 10,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.9271,
      attributeMultiplier: 1.3907,
      physFixed: 257,
      attributeFixed: 140,
      extraCritDamage: 0,
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
