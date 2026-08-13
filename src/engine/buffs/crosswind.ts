// Sword Horizon's crosswind-charge state machine is deliberately NOT modeled
// inside `BuffEngine`: it's per-detonation-cast STATE, not a time-windowed
// buff a skill's tag either is or isn't inside. See
// `src/data/innerWays/swordHorizonZenith.ts`'s `zenithBar`, which is never
// seeded or activated — this tracker is the real implementation.
export interface CrosswindOutcome {
  chargeAtDetonation: number
  guaranteedAffinity: boolean
  damageBonusActive: boolean
}

export interface CrosswindTrackerOptions {
  maxCharges: number
  retainOnMax: boolean
}

export class CrosswindTracker {
  private charges = 0

  constructor(private readonly options: CrosswindTrackerOptions) {}

  get charge(): number {
    return this.charges
  }

  onDetonation(): CrosswindOutcome {
    const { maxCharges, retainOnMax } = this.options
    const chargeAtDetonation = this.charges
    const guaranteedAffinity = chargeAtDetonation >= maxCharges
    this.charges = guaranteedAffinity
      ? retainOnMax
        ? 1
        : 0
      : Math.min(maxCharges, this.charges + 1)
    return { chargeAtDetonation, guaranteedAffinity, damageBonusActive: chargeAtDetonation > 0 }
  }
}
