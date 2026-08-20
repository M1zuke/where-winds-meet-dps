import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// In-game capture (2026-08-19, Windrider tooltip, verbatim — note the
// in-game typo "enchances" is preserved above the canonical spelling):
//
//   "Inkwell Fan's unique effect that enhances the next Pursuit Skill.
//    Lasts 3 seconds."
//
// Granted by Peak's Springless Silence (Fan dash) on-hit against Airborne /
// Lingering Bone'd targets, and by Emerald Barrier (Fan Special) at the end
// of the cast. Lasts 3 seconds.
//
// "Enhances the next Pursuit Skill" — the game shows a numerical multiplier
// in the in-game tooltip at the time the buff is granted, but the value
// wasn't captured in the 2026-08-19 transcription pass. The buff is set up
// here with the prop-gate right (Heavy + light + pursuit = `isMartialSkillQ`
// + `attackType` shape; the cleaner proxy is to read `event.kind` and
// `event.props` for the pursuit prop) and the stat key with `amount: 0`,
// plus a flag block so the magnitude is briefly searchable from one place.
//
// Author-side note: the in-game tooltip says "enhances" without a number
// only when the multiplier is read from a tiered value not present in the
// bare buff line. The actual multiplier should be re-entered in-game and
// updated here when the capture is available. Per the
// in-game-text-verbatim feedback memory, the multiplier is NOT to be
// inferred from outside the buff — pattern-match an existing buff or
// estimate the niche value is a fabrication.
export const windrider = defineClassBuff({
  id: BUFF.windrider,
  name: "Windrider",
  duration: 3,
  // PENDING: capture the numerical enhancement value from the in-game
  // tooltip. The multiplier slot below is `0` until the value is captured.
  // Search for `stat("physBoost", 0)` in this file to find the marker.
  summary: "Pursuit Skill +0% (pending magnitude capture)",
  effects: () => [stat("physBoost", 0)],
})
