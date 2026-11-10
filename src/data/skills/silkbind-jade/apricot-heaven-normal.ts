import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { castSkill, meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { enduranceCost, enduranceMeter } from "../../resources/enduranceMeter"
import { LEVEL_ROWS } from "./levelRows"

// The umbrella's second charged-Heavy form: fly up with an AoE rise, then
// fall. Released the moment the air charge opens, before the 1.5 s
// threshold — the earliest release of the normal-fall stage
// (docs/TIMELINE.md § "Meters"). In-game values as of 2026-09-24.
export const apricotHeavenNormal = defineSkill({
  id: SKILL.apricotHeavenNormal,
  classId: "silkbindJade",
  name: "Apricot Heaven (Normal Fall)",
  breakdownName: "Apricot Heaven",
  tags: [PROP.isCharged, WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbCharged],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.apricotHeavenNormal,
  receives: [BUFF.pursuitChargedBoost, ...VERNAL_UMBRELLA_RECEIVES],
  // In-game values as of 2026-09-24: -5 at the cast's own start.
  meterCosts: [enduranceCost(5)],
  castFrames: 214,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach (the cast is its
  // Heavy Attack); the rise is a vertical AoE with no further scripted
  // displacement.
  reachMeters: 3,
  hits: [
    hit(0, {
      // In-game values as of 2026-11-10: the rise lands 54.18 f after the
      // 14.4 f hold decision.
      frame: 68.58,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [castSkill({ target: SKILL.apricotHeavenRise })],
    }),
    hit(1, {
      // In-game values as of 2026-11-10: the earliest release is the moment
      // the air charge opens, 72 f after the hold decision; the fall's collider
      // is 27.15 f into the release.
      frame: 113.55,
      ...levelScaled(LEVEL_ROWS.apricotHeavenNormalHit1),
    }),
    hit(2, {
      // In-game values as of 2026-11-10: -5 more 1.6 s after the hold
      // decision — a zero-damage marker, the pattern `legioncrusher.ts` uses.
      frame: 110.4,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [meterDelta({ target: enduranceMeter.id, stacks: -5 })],
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
