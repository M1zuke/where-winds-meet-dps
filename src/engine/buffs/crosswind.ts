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
  initialCharges?: number
}

export class CrosswindTracker {
  private charges: number

  constructor(private readonly options: CrosswindTrackerOptions) {
    const opening = Math.floor(options.initialCharges ?? 0)
    this.charges = Math.max(0, Math.min(options.maxCharges, Number.isFinite(opening) ? opening : 0))
  }

  get charge(): number {
    return this.charges
  }

  onDetonation(): CrosswindOutcome {
    const { maxCharges, retainOnMax } = this.options
    const chargeAtDetonation = this.charges
    const guaranteedAffinity = chargeAtDetonation >= maxCharges
    // In-game values as of 2026-09-24: a forced-Affinity burst keeps its
    // retained charge (1 at tier 6, 0 below) and ALSO adds the burst's own
    // +1, so the burst right after it still carries the damage bonus.
    const retained = guaranteedAffinity ? (retainOnMax ? 1 : 0) : this.charges
    this.charges = Math.min(maxCharges, retained + 1)
    return { chargeAtDetonation, guaranteedAffinity, damageBonusActive: chargeAtDetonation > 0 }
  }
}
