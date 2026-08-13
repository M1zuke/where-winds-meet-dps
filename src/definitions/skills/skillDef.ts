import type { HitVariant, Skill, SkillHit } from "../../engine/skill"
import type { Debuff } from "../../engine/debuff"
import type { Buff } from "../../engine/buff"

// An undeclared key is otherwise accepted and then read by nothing, leaving the
// author believing an unimplemented field took effect.
type NoExcessKeys<T, Shape> = { [K in Exclude<keyof T, keyof Shape>]: never }

// Crosses two boundaries a skill must stay a plain value for — `localStorage`
// (`Inputs.customSkills`) and `postMessage` (`Inputs` → `dpsWorker.ts`) — so,
// unlike `defineBuff`, this takes no callbacks. It does no runtime work; it
// exists so TypeScript checks each literal at its definition site, and the
// `const` type parameter keeps literal id/tag types narrow.
export function defineSkill<const T extends Skill>(skill: T & NoExcessKeys<T, Skill>): T {
  return skill
}

// Same reasoning as `defineSkill`: a `Debuff` crosses `Inputs.customDebuffs`
// and `postMessage`, so it stays a plain value with no callbacks.
export function defineDebuff<const T extends Debuff>(debuff: T & NoExcessKeys<T, Debuff>): T {
  return debuff
}

// A class-owned `Buff` the timeline reads as a gate, listed on `ClassDef.gateBuffs`.
// Same plain-value constraint again — `Inputs.customBuffs` crosses both boundaries.
export function defineGateBuff<const T extends Buff>(buff: T & NoExcessKeys<T, Buff>): T {
  return buff
}

interface HitSpec {
  frame: number
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
  extraCritDamage?: number
  triggers?: SkillHit["triggers"]
  variants?: HitVariant[]
}

// The array POSITION is the id (`hit-0`, `hit-1`, …) — verified safe: every
// hit id in every converting file already follows that pattern, and the
// Skill Editor keys off it, so `index` here must match the hit's position in
// `Skill.hits`.
export function hit(index: number, spec: HitSpec): SkillHit {
  return {
    id: `hit-${index}`,
    frame: spec.frame,
    physMultiplier: spec.physMultiplier,
    attributeMultiplier: spec.attributeMultiplier,
    physFixed: spec.physFixed,
    attributeFixed: spec.attributeFixed,
    extraCritDamage: spec.extraCritDamage ?? 0,
    triggers: spec.triggers ?? [],
    ...(spec.variants ? { variants: spec.variants } : {}),
  }
}

interface DotTicksSpec {
  count: number
  everyFrames: number
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
}

// Permitted only where every tick is provably identical apart from its frame
// — the moment ticks differ, write them out with `hit()` instead.
export function dotTicks(spec: DotTicksSpec): SkillHit[] {
  return Array.from({ length: spec.count }, (_, index) =>
    hit(index, {
      frame: index * spec.everyFrames,
      physMultiplier: spec.physMultiplier,
      attributeMultiplier: spec.attributeMultiplier,
      physFixed: spec.physFixed,
      attributeFixed: spec.attributeFixed,
    }),
  )
}
