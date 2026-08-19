import { PROP } from "../../data/skills/ids"

export type QiPhase = "normal" | "below30" | "exhausted"

export interface BuildView {
  classId: string
  spec: string | undefined
  armorSet: string | undefined
  param(id: string): boolean
  paramTier(id: string): number
  paramValue(id: string): number
}

export interface TargetView {
  isTrainingDummy: boolean
  // The target's current Qi phase. Same timeline-driven shape as `phase` on
  // the context top-level (which is also the target's phase for our boss
  // model — see `simulateTimeline`'s `qiBreakWindow` plumbing) but kept
  // distinct so buffs that key on the *target's* phase don't have to know
  // they're reading the same value as the cast's phase. Defaults to
  // `"normal"` so a def can read it without checking optionality.
  phase: QiPhase
  // Whether the target is currently Airborne. Defaults to `false` so a def
  // can read it without optionality; populated from `params.targetAirborne`
  // for now (a single boolean), with a future `airborneWindow` mechanic
  // likely replacing it once the in-game timing is captured.
  airborne: boolean
}

export interface StatusView {
  isActive(id: string): boolean
  stacks(id: string): number
  appliedAt(id: string): number | null
  expiresAt(id: string): number | null
}

type PropKey<Tag> = Tag extends `prop:${infer Suffix}` ? Suffix : never
type SkillPropertyKey = PropKey<(typeof PROP)[keyof typeof PROP]>

// `timeline.ts` builds the `prop:`-derived members from a skill's tags via
// `PROP_TO_PROPERTY`, plus `hitCount` and `castTime`. The rest —
// `noBuffTrigger`, `duration`, `buffAppliesOnCastEnd` — have no production
// producer; only `tests/engine/buffEngine*.test.ts` sets them directly, kept
// optional so that direct-construction path still typechecks.
export type SkillProperties = Partial<Record<SkillPropertyKey, boolean>> & {
  attackType?: "heavy" | "light" | "mixed" | "charge"
  hitCount?: number
  castTime?: number
  noBuffTrigger?: boolean
  duration?: number
  buffAppliesOnCastEnd?: boolean
}

// The build side of the same correspondence: every `PROP` tag maps to the
// `SkillProperties` key `timeline.ts` sets when a skill carries that tag. A
// `PROP` entry added without a line here is a build error (a `Record` over a
// union type requires every member), so a mistyped tag cannot fall through
// silently.
export const PROP_TO_PROPERTY: Record<(typeof PROP)[keyof typeof PROP], SkillPropertyKey> = {
  [PROP.abrasionImmune]: "abrasionImmune",
  [PROP.consumesInnerPassion]: "consumesInnerPassion",
  [PROP.consumesInnerPassionBurningHeart]: "consumesInnerPassionBurningHeart",
  [PROP.hasLowQiCritBoost]: "hasLowQiCritBoost",
  [PROP.hasLowQiDmgBoost]: "hasLowQiDmgBoost",
  [PROP.hasQiBreakDoubleDamage]: "hasQiBreakDoubleDamage",
  [PROP.hasQiBreakPhysPen]: "hasQiBreakPhysPen",
  [PROP.isBallistic]: "isBallistic",
  [PROP.isCharged]: "isCharged",
  [PROP.isExecution]: "isExecution",
  [PROP.isMartialSkillQ]: "isMartialSkillQ",
  [PROP.isPerfectDodge]: "isPerfectDodge",
  [PROP.shatteredRidgeBoost]: "shatteredRidgeBoost",
}

export type EffectEvent =
  | { kind: "cast"; castTag: string; props: SkillProperties }
  | { kind: "damage"; castTag: string; tags: ReadonlySet<string> }
  | { kind: "display" }

// Read-only and engine-free: a buff module receives a view, never the engine
// handle, so every callback is a pure function testable with a plain object
// literal and no engine mock.
export interface EffectContext {
  readonly timeSec: number
  readonly phase: QiPhase
  readonly build: BuildView
  readonly target: TargetView
  readonly status: StatusView
  // `hp` / `hpMax` are the casting player's current and max HP at hit time.
  // Both default to a "full HP, no HP-gated logic" sentinel (`hp = hpMax`)
  // so a def that does not read either field gets a no-op and the buff
  // engine can omit the params without every call site checking for
  // optionality. Star Reacher T1 (`+3% damage if HP > 75%, else heal = 10%
  // of damage done`) is the first consumer; future HP-gated buffs can read
  // `hp / hpMax` without further plumbing. Populated from
  // `params.playerHp` / `params.playerHpMax` — see `BuffEngine.buildContext`.
  readonly self: { stacks: number; reachesEvent: boolean; hp: number; hpMax: number }
  readonly event: EffectEvent
}
