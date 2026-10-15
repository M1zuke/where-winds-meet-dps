import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import { enduranceMeter } from "../../resources/enduranceMeter"

// In-game values as of 2026-10-15: Flying Tornado shortens the charge level
// from 0.55 s to 0.36 s (−11.4 f) and the whirlwind flies at 30 m/s instead of
// 20; the entry hold and the release clip are unchanged.
const FLYING_TORNADO_ACTIVE = { buffId: BUFF.gourdTossFlyingTornado, op: "gte" as const, stacks: 1 }

// In-game values as of 2026-10-15: the whirlwind spawns 1 m ahead of the caster
// in a 1.5 m long collision box, so it touches the target 1.75 m before its
// centre would; it lives 1 s.
const WHIRLWIND_PROJECTILE = {
  speedMetersPerSecond: 20,
  contactAdvanceMeters: 1.75,
  maxTravelFrames: 60,
}
const FLYING_TORNADO_WHIRLWIND_PROJECTILE = {
  ...WHIRLWIND_PROJECTILE,
  speedMetersPerSecond: 30,
}

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
  triggersBuffs: [BUFF.lingeringBone, BUFF.starReacherSupreme, BUFF.starReacher],
  // In-game values as of 2026-09-26: a 30 / s Endurance drain from 0.24 s of
  // the hold, stopping 0.55 s later; frozen for the whole hold otherwise.
  meterDrains: [{ meterId: enduranceMeter.id, perSecond: 30, fromFrame: 14.4, stopAfterSec: 0.55 }],
  meterFreezes: [{ meterId: enduranceMeter.id, fromFrame: 0 }],
  // Cast length to the earliest next input for the shortest hold (in-game
  // values as of 2026-10-15): 14.4 f hold + 33 f charge + 50.4 f release.
  castFrames: 97.8,
  triggerable: true,
  // In-game values as of 2026-10-15: no approach — the whirlwind's own 20 m
  // range is the reach; a further 1.75 m shrink-only pull toward a locked
  // target.
  reachMeters: 20,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      // In-game values as of 2026-10-15: the whirlwind launch frame for the
      // shortest hold; it lands after its flight.
      frame: 71.4,
      projectile: WHIRLWIND_PROJECTILE,
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
      variants: [
        {
          id: "hv-fanlightcharged-hit-0-flying-tornado",
          label: "Flying Tornado",
          conditions: [FLYING_TORNADO_ACTIVE],
          physMultiplier: 1.9044,
          attributeMultiplier: 2.8566,
          physFixed: 527,
          attributeFixed: 287,
          frame: 60,
          castFrames: 86.4,
          projectile: FLYING_TORNADO_WHIRLWIND_PROJECTILE,
        },
      ],
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
