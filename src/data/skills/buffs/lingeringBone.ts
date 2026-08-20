import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { PROP } from "../ids"
import { damageMultiplier } from "../../../engine/effects/effect"

// "When the target is Lingering Bone/Airborne, the umbrella will consume an
// extra 10/15 Blossoms per second to fire enhanced projectiles dealing
// 100%/200% extra damage, while extending the duration of Lingering Bone/
// Airborne on non-player targets." (in-game Vernal Umbrella special-skill text,
// 18 Aug 2026.) Airborne has no state in this sim and the Blossoms cost is a
// resource it does not track, so only the Lingering Bone half is modelled.
//
// `DRONE_TICK` states the BASE projectile for this reason: its source row
// measures the enhanced one, so the enhancement is divided out there and
// applied here instead, where it responds to the mark actually being up.
//
// `damageMultiplier` rather than a +1.0 `allDamageBoost`, for the reason
// `behavior.ts` gives for Dragon Head - Plus's doubling: an extra 100% of the
// projectile's own damage is multiplicative on top of (1+H), and a boost that
// size would instead be diluted by the additive pool.
//
// The reference's `refreshOn: { skillProperty: "isDrone", onlyIfActive: true }`
// is modelled too: a drone projectile extends the mark on a non-player target,
// and a drone firing at an unmarked one never opens it. Its `onApplyFn` stays
// unmodelled — `specMeta.json` names the handler but nothing sources it.
//
// 2s is the boss-unit duration; a non-boss carries it for 0.8s (in-game
// Follow-up Skill text, 18 Aug 2026), and this sim's target is a dummy.
const ENHANCED_PROJECTILE_MULTIPLIER = 2

export const lingeringBone = defineBuff({
  id: BUFF.lingeringBone,
  name: "Lingering Bone",
  duration: 2,
  extendedOnlyByProperty: PROP.isDrone,
  effects: [damageMultiplier(ENHANCED_PROJECTILE_MULTIPLIER)],
})
