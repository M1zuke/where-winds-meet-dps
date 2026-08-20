import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { makeTrigger } from "../../../engine/skill"
import { ATTACK, ATTUNE, CAST, WEAPON, PROP } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// Moon Shatter Spring, 5-hit enhanced branch (in-game capture, 2026-08-19,
// verbatim):
//
//   "When you are under the Windrider effect, unleash an enhanced five-hit
//    combo to deal high damage and gain Tenacity in non-Arena modes."
//
// Per-hit values from the same tooltip pass: 301.85% / 452.78% phys/attr
// coeff and 835 / 455 phys/attr fixed. The 3-hit path is 124.78% / 187.16%
// / 346 / 188, so the 5-hit sits at roughly 2.42× the per-hit damage — the
// "+42% phys/attr coeff + +141% phys/attr fixed" extraction in
// buffs/windrider.ts is the additive-flat-stats interpretation of that
// 2.42× ratio, FLAGGED FOR REVIEW.
//
// "Gain Tenacity in non-Arena modes" is not modelled — Tenacity is a
// PvE-only resilience buff, irrelevant to the simulated target.
//
// TODO(castRequires): the Windrider-active gate is not representable yet —
// Skill has no `castRequires` field, and the cleaner shape is to wrap the
// gate in a buff-style `requiresBuffActive: BUFF.windrider` (the buff
// engine's `BuffMeta.requiresBuffActive` already exists; see
// engine/buffs/buffModule.ts). Defer to the engine-extension sweep.
export const fanHeavyPursuit5Hit = defineSkill({
  id: SKILL.fanHeavyPursuit5Hit,
  classId: "silkbindJade",
  name: "FanHeavyPursuit 5-Hit",
  abilityTag: "FanHeavyPursuit 5-Hit",
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
  castTag: CAST.fanHeavyPursuit5Hit,
  castFrames: 150,
  triggerable: true,
  // Moon Shatter Spring tooltip: "Hitting a non-player enemy with the ...
  // enhanced five-hit combo ... grants you one stack of Shattered Spring."
  // One stack per cast, fired on the last hit (see last entry's `triggers`
  // below). Listed here so the orphan check sees the buff reach.
  triggersBuffs: [BUFF.startlingSpring],
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 3.0185,
      attributeMultiplier: 4.5278,
      physFixed: 835,
      attributeFixed: 455,
      extraCritDamage: 1,
      triggers: [],
    }),
    hit(1, {
      frame: 30,
      physMultiplier: 3.0185,
      attributeMultiplier: 4.5278,
      physFixed: 835,
      attributeFixed: 455,
      extraCritDamage: 1,
      triggers: [],
    }),
    hit(2, {
      frame: 60,
      physMultiplier: 3.0185,
      attributeMultiplier: 4.5278,
      physFixed: 835,
      attributeFixed: 455,
      extraCritDamage: 1,
      triggers: [],
    }),
    hit(3, {
      frame: 90,
      physMultiplier: 3.0185,
      attributeMultiplier: 4.5278,
      physFixed: 835,
      attributeFixed: 455,
      extraCritDamage: 1,
      triggers: [],
    }),
    hit(4, {
      frame: 120,
      physMultiplier: 3.0185,
      attributeMultiplier: 4.5278,
      physFixed: 835,
      attributeFixed: 455,
      extraCritDamage: 1,
      // Moon Shatter Spring tooltip: "Hitting a non-player enemy with the ...
      // enhanced five-hit combo ... grants you one stack of Shattered Spring."
      // Fire on the last hit so a single cast grants exactly one stack.
      triggers: [makeTrigger({ kind: "applyBuff", targetId: BUFF.startlingSpring, stacks: 1 })],
    }),
  ],
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})