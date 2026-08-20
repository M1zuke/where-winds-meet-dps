import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { makeTrigger } from "../../../engine/skill"
import { ATTACK, ATTUNE, CAST, WEAPON, PROP } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// Moon Shatter Spring, 3-hit branch (in-game capture, 2026-08-19, verbatim):
//
//   "Perform an aerial Heavy Attack against targets who are airborne or have a
//    Lingering Bone mark from you, launching three consecutive strikes with
//    the fan, dealing moderate damage."
//
// Per-hit values from the same tooltip pass: 124.78% / 187.16% phys/attr coeff
// and 346 / 188 phys/attr fixed. The +45% non-player bonus lives on the buff
// def (see buffs/startlingSpring.ts) — the engine has no per-skill target
// filter, so it rides the same buff the cast grants.
//
// TODO(castRequires): the airborne-or-Lingering-Bone pre-cast filter is not
// representable yet — Skill has no `castRequires` field. The gate would also
// need a `TargetView.lingeringBoneFromYou` source-attribute field. Defer to
// the engine-extension sweep.
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
  // Moon Shatter Spring tooltip: "Hitting a non-player enemy with the
  // three-hit combo ... grants you one stack of Shattered Spring."
  // One stack per cast, fired on the last hit (see last entry's `triggers`
  // below). Listed here so the orphan check sees the buff reach.
  triggersBuffs: [BUFF.startlingSpring],
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.2478,
      attributeMultiplier: 1.8716,
      physFixed: 346,
      attributeFixed: 188,
      extraCritDamage: 1,
      triggers: [],
    }),
    hit(1, {
      frame: 30,
      physMultiplier: 1.2478,
      attributeMultiplier: 1.8716,
      physFixed: 346,
      attributeFixed: 188,
      extraCritDamage: 1,
      triggers: [],
    }),
    hit(2, {
      frame: 60,
      physMultiplier: 1.2478,
      attributeMultiplier: 1.8716,
      physFixed: 346,
      attributeFixed: 188,
      extraCritDamage: 1,
      // Moon Shatter Spring tooltip: "Hitting a non-player enemy with the
      // three-hit combo ... grants you one stack of Shattered Spring."
      // Fire on the last hit so a single cast grants exactly one stack.
      triggers: [makeTrigger({ kind: "applyBuff", targetId: BUFF.startlingSpring, stacks: 1 })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})
