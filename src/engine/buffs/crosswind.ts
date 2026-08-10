// Sword Horizon's crosswind-charge state machine is deliberately NOT modeled
// inside `BuffEngine`: it's per-detonation-cast STATE, not a time-windowed
// buff a skill's tag either is or isn't inside. See
// `src/data/skills/buffs/crosswindSpirit.ts`, which is never seeded or
// activated — this tracker is the real implementation.
export interface CrosswindOutcome {
  chargeAtDetonation: number
  guaranteedAffinity: boolean
  spiritBonusActive: boolean
}

export class CrosswindTracker {
  private charges = 0

  constructor(private readonly retainOnMax: boolean) {}

  get charge(): number {
    return this.charges
  }

  onDetonation(): CrosswindOutcome {
    const chargeAtDetonation = this.charges
    const guaranteedAffinity = chargeAtDetonation >= 5
    this.charges = guaranteedAffinity ? (this.retainOnMax ? 1 : 0) : Math.min(5, this.charges + 1)
    return { chargeAtDetonation, guaranteedAffinity, spiritBonusActive: chargeAtDetonation > 0 }
  }
}
