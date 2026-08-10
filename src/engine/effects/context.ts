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
// `PROP_TO_PROPERTY`, plus `hitCount` and `castTime`. The rest — `isDrone`,
// `noBuffTrigger`, `duration`, `buffAppliesOnCastEnd` — have no production
// producer; only `tests/engine/buffEngine*.test.ts` sets them directly, kept
// optional so that direct-construction path still typechecks.
export type SkillProperties = Partial<Record<SkillPropertyKey, boolean>> & {
  attackType?: "heavy" | "light" | "mixed" | "charge"
  hitCount?: number
  castTime?: number
  isDrone?: boolean
  noBuffTrigger?: boolean
  duration?: number
  buffAppliesOnCastEnd?: boolean
}

// The build side of the same correspondence: every `PROP` tag maps to the
// `SkillProperties` key `timeline.ts` sets when a skill carries that tag. A
// `PROP` entry added without a line here is a build error (a `Record` over a
// union type requires every member), which is what closes the hole a
// mistyped or newly-added `prop:` tag used to fall through silently.
export const PROP_TO_PROPERTY: Record<(typeof PROP)[keyof typeof PROP], SkillPropertyKey> = {
  [PROP.abrasionImmune]: "abrasionImmune",
  [PROP.consumesInnerPassion]: "consumesInnerPassion",
  [PROP.consumesInnerPassionBurningHeart]: "consumesInnerPassionBurningHeart",
  [PROP.hasLowQiCritBoost]: "hasLowQiCritBoost",
  [PROP.hasLowQiDmgBoost]: "hasLowQiDmgBoost",
  [PROP.hasQiBreakDoubleDamage]: "hasQiBreakDoubleDamage",
  [PROP.hasQiBreakPhysPen]: "hasQiBreakPhysPen",
  [PROP.isCharged]: "isCharged",
  [PROP.isExecution]: "isExecution",
  [PROP.isMartialSkillQ]: "isMartialSkillQ",
}

// `refreshOn.skillProperty` / `ConsumeOnMatch.skillProperty` / `excludeProperty` /
// `perCastConsume.triggerSkillProperty` are `BuffDef` fields that name a
// `SkillProperties` key by string, so the read has to stay dynamic — but it
// reads through `SkillProperties` itself rather than an unrelated generic
// bag, the one narrowing available without changing `BuffDef`'s schema.
export function readSkillProperty(props: SkillProperties, key: string): unknown {
  return (props as Record<keyof SkillProperties, unknown>)[key as keyof SkillProperties]
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
  readonly self: { stacks: number }
  readonly event: EffectEvent
}
