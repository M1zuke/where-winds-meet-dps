import type { StatKey } from "../statRegistry"
import type { ArtBonusField, Effect } from "./effect"

// Total: every sink implements every member, even the ones it no-ops — a
// no-op has to be a real method body, never an omitted optional member, or
// the exhaustiveness this buys is fake.
export interface EffectSink {
  stat(statKey: StatKey, amount: number): void
  forceOutcome(outcome: "crit" | "affinity"): void
  applyBuff(id: string, stacks: number | undefined, durationSec: number | undefined): void
  consumeStacks(id: string, count: number): void
  artBonus(field: ArtBonusField, amount: number): void
  damageMultiplier(factor: number): void
  setStatus(
    id: string,
    stacks: number | undefined,
    permanent: boolean | undefined,
    durationFrames: number | undefined,
  ): void
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled Effect: ${JSON.stringify(value)}`)
}

export function applyEffect(sink: EffectSink, effect: Effect): void {
  switch (effect.kind) {
    case "stat":
      sink.stat(effect.statKey, effect.amount)
      return
    case "forceOutcome":
      sink.forceOutcome(effect.outcome)
      return
    case "applyBuff":
      sink.applyBuff(effect.id, effect.stacks, effect.durationSec)
      return
    case "consumeStacks":
      sink.consumeStacks(effect.id, effect.count)
      return
    case "artBonus":
      sink.artBonus(effect.field, effect.amount)
      return
    case "damageMultiplier":
      sink.damageMultiplier(effect.factor)
      return
    case "setStatus":
      sink.setStatus(effect.id, effect.stacks, effect.permanent, effect.durationFrames)
      return
    default:
      assertNever(effect)
  }
}
