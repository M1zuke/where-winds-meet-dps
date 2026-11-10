// QI-BREAK MODEL — deliberate deviation from the site (in-game verified
// 2026-08-01): the site doubles the stack COUNT (capped at 10) at 1 %/stack
// (`ta()` ~L42356-42363), but in game the buff never exceeds 5 stacks —
// instead acquisition doubles (still capped at 5) and the per-stack damage
// boost doubles to 2 %, while phys pen per stack (~L22704) stays unchanged.
// Morale pen lands on `phys.penetration` only, never `bellstrike.penetration`
// — the site's weapon/attribute pen track (~L22705) never sums it.
export const MORALE_DMG_PER_STACK = 0.01
export const MORALE_DMG_PER_STACK_QI_BREAK = 0.02
export const MORALE_PEN_PER_STACK = 0.02 // site's moralePenBase: 2 pen points (~L22248) → 0.02 in the panel's fraction-of-100 unit
export const MORALE_STACK_THRESHOLD = 5 // site's zi.moraleStackThreshold
export const MORALE_MAX_STACKS = 5

// In-game values as of 2026-11-10: a direct hit adds a stack at most once per
// 2 s, each add renews the 12 s window, and the window lapsing drops every
// stack. Yi River fires on a landed direct hit while the full stacks are up,
// at most once per 10 s, and lands 0.05 s after that hit.
export const MORALE_STACK_INTERVAL_SEC = 2
export const MORALE_STACK_LIFETIME_SEC = 12
export const YI_RIVER_INTERVAL_SEC = 10
export const YI_RIVER_DELAY_SEC = 0.05

export function moraleDmgPerStack(controlled: boolean): number {
  return controlled ? MORALE_DMG_PER_STACK_QI_BREAK : MORALE_DMG_PER_STACK
}

interface StackStep {
  gainedAtSec: number
  stacks: number
}

export class MoraleStacks {
  private steps: StackStep[] = []

  stacksAt(timeSec: number): number {
    for (let index = this.steps.length - 1; index >= 0; index--) {
      const step = this.steps[index]!
      if (step.gainedAtSec > timeSec) continue
      return timeSec < step.gainedAtSec + MORALE_STACK_LIFETIME_SEC ? step.stacks : 0
    }
    return 0
  }

  gainFromDirectHit(timeSec: number): void {
    const last = this.steps[this.steps.length - 1]
    if (last && timeSec - last.gainedAtSec < MORALE_STACK_INTERVAL_SEC) return
    this.steps.push({
      gainedAtSec: timeSec,
      stacks: Math.min(MORALE_MAX_STACKS, this.stacksAt(timeSec) + 1),
    })
  }
}
