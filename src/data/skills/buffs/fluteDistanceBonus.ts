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

// In-game values as of 2026-09-28: +1 %/m up to 5 m, then +3 %/m, capped at
// +20 % from 9 m to 20 m (centre-to-centre distance). No band covers 20 m or
// beyond, so the bonus is 0 there.
const DISTANCE_BANDS: readonly { minMeters: number; maxMeters: number; bonus: number }[] = [
  { minMeters: 0, maxMeters: 1, bonus: 0.01 },
  { minMeters: 1, maxMeters: 2, bonus: 0.02 },
  { minMeters: 2, maxMeters: 3, bonus: 0.03 },
  { minMeters: 3, maxMeters: 4, bonus: 0.04 },
  { minMeters: 4, maxMeters: 5, bonus: 0.05 },
  { minMeters: 5, maxMeters: 6, bonus: 0.08 },
  { minMeters: 6, maxMeters: 7, bonus: 0.11 },
  { minMeters: 7, maxMeters: 8, bonus: 0.14 },
  { minMeters: 8, maxMeters: 9, bonus: 0.17 },
  { minMeters: 9, maxMeters: 10, bonus: 0.2 },
  { minMeters: 10, maxMeters: 20, bonus: 0.2 },
]

function distanceBonus(distanceMeters: number): number {
  const band = DISTANCE_BANDS.find(
    (candidate) => distanceMeters >= candidate.minMeters && distanceMeters < candidate.maxMeters,
  )
  return band?.bonus ?? 0
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
