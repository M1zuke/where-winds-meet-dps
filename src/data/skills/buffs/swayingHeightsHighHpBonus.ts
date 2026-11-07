import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { swayingHeights } from "../../sets/swayingHeights"

const MIN_FRACTION = 0.5
const BASE_BONUS = 0.05
const STEP_FRACTION = 0.05
const STEP_BONUS = 0.01
const MAX_BONUS = 0.1

function bonusFor(remainingHealthFraction: number): number {
  if (remainingHealthFraction <= MIN_FRACTION) return 0
  const steps = Math.floor((remainingHealthFraction - MIN_FRACTION) / STEP_FRACTION)
  return Math.min(BASE_BONUS + steps * STEP_BONUS, MAX_BONUS)
}

// "Increases the damage dealt against targets with more than 50% HP by 5%.
// Every 5% more HP further increases this bonus by 1%, up to 10%." (in-game
// set tooltip, 2026-09-24.)
export const swayingHeightsHighHpBonus = defineBuff({
  id: BUFF.swayingHeightsHighHpBonus,
  name: "Swaying Heights",
  requires: { set: swayingHeights.siteKey },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +5%..+10% vs a target above 50% HP",
  effects: (ctx) => [stat("allDamageBoost", bonusFor(ctx.target.remainingHealthFraction))],
})
