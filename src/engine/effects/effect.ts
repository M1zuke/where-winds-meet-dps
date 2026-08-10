import type { StatKey } from "../statRegistry"

// The two fields `hitToArtRow` never sets, so an `artBonus` effect is always
// additive onto an absent (zero-ish) starting value — never a replace.
// `extraCritDamage` is deliberately excluded: `hitToArtRow` DOES set it, and
// `buildArt` may overwrite it again resolving the crit-boost sentinel — a
// replace, not an addition (see `behavior.ts`). It has no `artBonus` producer.
export type ArtBonusField = "extraCritRate" | "extraPhysPenetration"

export type Effect =
  | { kind: "stat"; statKey: StatKey; amount: number }
  | { kind: "forceOutcome"; outcome: "crit" | "affinity" }
  | { kind: "applyBuff"; id: string; stacks?: number; durationSec?: number }
  | { kind: "consumeStacks"; id: string; count: number }
  | { kind: "artBonus"; field: ArtBonusField; amount: number }
  | { kind: "damageMultiplier"; factor: number }
  | { kind: "setStatus"; id: string; stacks?: number; permanent?: boolean; durationFrames?: number }

// The subset `SkillBehavior.claimStatEffects`/`onHit` may return — before the
// formula context is built. `forceOutcome` narrows to "affinity": nothing
// before the context exists needs to force a crit, that is a buff-side effect
// (`legacyBuffModule.ts`'s `forceCrit`) applied through `BuffEngine`'s own
// damage-time sink. Narrower than `Effect` so returning the wrong kind from a
// behaviour is a compile error, not a silently dropped effect.
export type HitEffect =
  Extract<Effect, { kind: "stat" | "setStatus" }> | { kind: "forceOutcome"; outcome: "affinity" }

// The subset `SkillBehavior.patchArt` may return — after the formula context
// is built.
export type ArtEffect = Extract<Effect, { kind: "artBonus" | "damageMultiplier" }>

export function stat(statKey: StatKey, amount: number): Extract<Effect, { kind: "stat" }> {
  return { kind: "stat", statKey, amount }
}

export function forceOutcome<Outcome extends "crit" | "affinity">(
  outcome: Outcome,
): { kind: "forceOutcome"; outcome: Outcome } {
  return { kind: "forceOutcome", outcome }
}

export function applyBuff(
  id: string,
  stacks?: number,
  durationSec?: number,
): Extract<Effect, { kind: "applyBuff" }> {
  return { kind: "applyBuff", id, stacks, durationSec }
}

export function consumeStacks(
  id: string,
  count: number,
): Extract<Effect, { kind: "consumeStacks" }> {
  return { kind: "consumeStacks", id, count }
}

export function artBonus(
  field: ArtBonusField,
  amount: number,
): Extract<Effect, { kind: "artBonus" }> {
  return { kind: "artBonus", field, amount }
}

export function damageMultiplier(factor: number): Extract<Effect, { kind: "damageMultiplier" }> {
  return { kind: "damageMultiplier", factor }
}

export function setStatus(
  id: string,
  opts: { stacks?: number; permanent?: boolean; durationFrames?: number } = {},
): Extract<Effect, { kind: "setStatus" }> {
  return { kind: "setStatus", id, ...opts }
}
