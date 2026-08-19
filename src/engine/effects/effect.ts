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
  // Heal applied to the casting player (the source of the hit). `amount` is
  // a flat HP value, not a percentage — fractional HP is allowed.
  | { kind: "heal"; amount: number }
  // Fraction-of-damage heal. The timeline resolves this to a flat HP gain
  // equal to `fraction * rolledDamage` post-formula, then applies the same
  // `heal` accounting (clamped to `[0, hpMax]`). Used by Star Reacher T1's
  // HP-below-75% branch: the in-game text reads "restore HP equal to 10% of
  // the damage done," and a fraction-of-rolled-damage kind expresses that
  // intent at emission time without the buff module needing to know the
  // hit's damage in advance. Buff modules may emit this kind; sinks no-op
  // it everywhere except the timeline's post-formula loop. See
  // `timeline.ts` for the resolver and `starReacherBuffs.ts` for the
  // canonical producer.
  | { kind: "healFraction"; fraction: number }

// The subset `SkillBehavior.claimStatEffects`/`onHit` may return — before the
// formula context is built. `forceOutcome` narrows to "affinity": nothing
// before the context exists needs to force a crit, that is a buff-side effect
// applied through `BuffEngine`'s own damage-time sink. Narrower than `Effect`
// so returning the wrong kind from a behaviour is a compile error, not a
// silently dropped effect.
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

export function heal(amount: number): Extract<Effect, { kind: "heal" }> {
  return { kind: "heal", amount }
}

export function healFraction(fraction: number): Extract<Effect, { kind: "healFraction" }> {
  return { kind: "healFraction", fraction }
}
