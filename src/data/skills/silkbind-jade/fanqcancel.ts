import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import {
  chargeAvailable,
  chargeCost,
  emeraldBarrierChargesMeter,
} from "../../classes/silkbind-jade/chargeMeters"
import { LEVEL_ROWS } from "./levelRows"

export const fanqcancel = defineSkill({
  id: SKILL.fanqcancel,
  classId: "silkbindJade",
  name: "FanQCancel",
  tags: [PROP.isMartialSkillQ, WEAPON.fan, ATTUNE.fanQ],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanQCancel,
  cancelledBy: "nextSkill",
  receives: [BUFF.starweaveMartialBoost, ...INKWELL_FAN_RECEIVES],
  triggersBuffs: [BUFF.jadeware, BUFF.windWall, BUFF.windWallPursuit, BUFF.springThunder],
  // In-game values as of 2026-10-15: Jadebreak lands with the wind wall at 10 f.
  triggersBuffsAtFrame: { [BUFF.windWall]: 10, [BUFF.windWallPursuit]: 10 },
  meterCosts: [chargeCost(emeraldBarrierChargesMeter)],
  castConditions: [chargeAvailable(emeraldBarrierChargesMeter)],
  // Cast length to the earliest next input (in-game values as of 2026-10-15;
  // collider + 1).
  castFrames: 10,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 9,
      ...levelScaled(LEVEL_ROWS.fanqHit0),
      extraCritDamage: 0,
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
