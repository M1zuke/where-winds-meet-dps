import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import { enduranceMeter } from "../../resources/enduranceMeter"

export const fanlightcharged = defineSkill({
  id: SKILL.fanlightcharged,
  classId: "silkbindJade",
  name: "FanLightCharged",
  tags: [PROP.isCharged, WEAPON.fan, ATTACK.light, ATTUNE.fanCharged, ROLE.fanLightCharged],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanLightCharged,
  receives: [
    BUFF.windWall,
    BUFF.pursuitChargedBoost,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    BUFF.nonPlayerBaseDamage145,
    ...INKWELL_FAN_RECEIVES,
  ],
  triggersBuffs: [BUFF.lingeringBone],
  // In-game values as of 2026-09-28: granted at the whirlwind's own hit, not
  // at the cast's start.
  triggersBuffsAtFrame: { [BUFF.lingeringBone]: 71 },
  // In-game values as of 2026-09-26: a 30 / s Endurance drain from 0.24 s of
  // the hold, stopping 0.55 s later; frozen for the whole hold otherwise.
  meterDrains: [{ meterId: enduranceMeter.id, perSecond: 30, fromFrame: 14.4, stopAfterSec: 0.55 }],
  meterFreezes: [{ meterId: enduranceMeter.id, fromFrame: 0 }],
  // Cast length to the earliest next input for the shortest hold (in-game
  // values as of 2026-09-24).
  castFrames: 98,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      // In-game values as of 2026-09-24: the whirlwind launch frame for the
      // shortest hold.
      frame: 71,
      physMultiplier: 1.9044,
      attributeMultiplier: 2.8566,
      physFixed: 527,
      attributeFixed: 287,
      extraCritDamage: 0,
      // In-game values as of 2026-09-26: +10 Endurance once per cast when the
      // whirlwind hits a non-player, landing at the cast's own end — after
      // the hold's own drain, not while the meter still sits at its cast-start
      // level.
      triggers: [meterDelta({ target: enduranceMeter.id, stacks: 10, appliesOnCastEnd: true })],
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
