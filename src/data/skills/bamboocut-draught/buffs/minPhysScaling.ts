export const MIN_PHYS_SCALING_CAP = 750

// These talents step in fixed Min Physical Attack increments below the cap
// rather than scaling continuously — `stepCount` full increments reach
// `maxBonus` at the cap. In-game values as of 2026-09-16.
export function steppedByMinPhysAttack(
  maxBonus: number,
  stepCount: number,
  minPhysAttack: number,
): number {
  const clamped = Math.min(Math.max(minPhysAttack, 0), MIN_PHYS_SCALING_CAP)
  const stepThreshold = MIN_PHYS_SCALING_CAP / stepCount
  const steps = Math.floor(clamped / stepThreshold + 1e-9)
  return Number(((steps / stepCount) * maxBonus).toFixed(9))
}
