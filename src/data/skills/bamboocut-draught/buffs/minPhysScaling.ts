export const MIN_PHYS_SCALING_CAP = 750

export function scaledByMinPhysAttack(maxBonus: number, minPhysAttack: number): number {
  const clamped = Math.min(Math.max(minPhysAttack, 0), MIN_PHYS_SCALING_CAP)
  return (clamped / MIN_PHYS_SCALING_CAP) * maxBonus
}
