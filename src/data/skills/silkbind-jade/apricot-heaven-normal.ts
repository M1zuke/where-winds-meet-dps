import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { enduranceCost, enduranceMeter } from "../../resources/enduranceMeter"

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
  receives: [...VERNAL_UMBRELLA_RECEIVES],
  // In-game values as of 2026-09-24: -5 at the cast's own start.
  meterCosts: [enduranceCost(5)],
  castFrames: 214,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach (the cast is Heavy
  // Attack 20601005); the rise is a vertical AoE with no further scripted
  // displacement.
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 54,
      physMultiplier: 0.626038,
      attributeMultiplier: 0.939057,
      physFixed: 173.2,
      attributeFixed: 94.4,
    }),
    hit(1, {
      // Hit frames with only a window (docs/TIMELINE.md, this class's own
      // evidence): the fall's own collider has no table row, only a bound
      // window from the release clip's own start — authored at that floor,
      // 72.00 f from the press.
      frame: 72,
      physMultiplier: 1.565095,
      attributeMultiplier: 2.347643,
      physFixed: 433.0,
      attributeFixed: 236.0,
    }),
    hit(2, {
      // In-game values as of 2026-09-24: -5 more at 1.6 s (96 f) in — a
      // zero-damage marker, the pattern `legioncrusher.ts` uses.
      frame: 96,
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
