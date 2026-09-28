import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { CAST } from "../ids"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-09-24: the flute that follows the caster arrives
// 3.4 s after the cast starts; a pre-pull cast arrives 2.1 s after its own
// (earlier) start instead.
export const fluteArrival = defineBuff({
  id: BUFF.fluteArrival,
  name: "Flute Arrival",
  duration: (ctx) => (ctx.event.kind === "cast" && ctx.event.castTag === CAST.fluteOfTheTidesPrepull ? 2.1 : 3.4),
  effects: [],
})

// In-game values as of 2026-09-24: +1 %/m up to 5 m, then +3 %/m, capped at
// +20 % from 9 m on, up to the table's own 20 m bound (centre-to-centre
// distance).
const DISTANCE_BANDS: readonly { belowMeters: number; bonus: number }[] = [
  { belowMeters: 1, bonus: 0.01 },
  { belowMeters: 2, bonus: 0.02 },
  { belowMeters: 3, bonus: 0.03 },
  { belowMeters: 4, bonus: 0.04 },
  { belowMeters: 5, bonus: 0.05 },
  { belowMeters: 6, bonus: 0.08 },
  { belowMeters: 7, bonus: 0.11 },
  { belowMeters: 8, bonus: 0.14 },
  { belowMeters: 9, bonus: 0.17 },
]
const DISTANCE_BONUS_CAP = 0.2

function distanceBonus(distanceMeters: number): number {
  const band = DISTANCE_BANDS.find((candidate) => distanceMeters < candidate.belowMeters)
  return band ? band.bonus : DISTANCE_BONUS_CAP
}

export const fluteDistanceBonus = defineBuff({
  id: BUFF.fluteDistanceBonus,
  name: "Flute of the Tides - Distance",
  affectsAll: true,
  duration: 12.4,
  activeAfterBuffEnds: { buffId: BUFF.fluteArrival },
  readsTargetDistance: true,
  summary: "allDamageBoost by distance to target, every hit including ticks",
  effects: (ctx) => [stat("allDamageBoost", distanceBonus(ctx.target.distanceMeters))],
})
