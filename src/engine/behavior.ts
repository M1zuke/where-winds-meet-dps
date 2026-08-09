// What a skill does beyond dealing its coefficients.
//
// The formula stays one shared function — a skill owns the decisions UPSTREAM
// of it, never a private copy of the arithmetic. Two constraints force that
// split and are worth stating, because both are easy to forget:
//
//   - A user-authored skill can never carry code. `inputs.customSkills` is JSON
//     out of localStorage, so the data path has to stay fully capable and a
//     module is a built-ins-only escape hatch.
//   - Almost no skill has behaviour. Of 24 Bellstrike Umbra skills, three do.
//
// Hence `DEFAULT_BEHAVIOR`: data-driven, what every skill gets unless it
// registers something of its own.
import type { Skill, SkillHit, HitVariant, TriggerCondition } from "./skill"
import { hitToArtRow, selectHitVariant } from "./skill"
import type { StatusView } from "./ledger"
import type { BuffStatEffect } from "./buff"
import type { computeSkillDamage } from "./formula"

export type ArtRow = Parameters<typeof computeSkillDamage>[0]

// The build, as a skill is allowed to see it: what was chosen, never the whole
// mutable `Inputs`.
export interface BuildView {
  classId: string
  set: string | null
  innerWayTier(name: string): number | null
  dingYin(tag: string): number
}

export interface HitInput {
  skill: Skill
  hit: SkillHit
  frame: number
  statuses: StatusView
  build: BuildView
  holds(condition: TriggerCondition): boolean
}

export interface HitModifiers {
  statEffects?: BuffStatEffect[]
  art?: Partial<ArtRow>
  forceCrit?: boolean
  forceGuaranteedAffinity?: boolean
}

export interface SkillBehavior {
  buildArt(input: HitInput): ArtRow
  chooseVariant(input: HitInput): HitVariant | null
  modify?(input: HitInput): HitModifiers | null
}

export const DEFAULT_BEHAVIOR: SkillBehavior = {
  chooseVariant(input) {
    return selectHitVariant(input.hit, input.holds)
  },
  buildArt(input) {
    const art = hitToArtRow(input.hit, input.skill)
    const variant = this.chooseVariant(input)
    if (variant) {
      art.physMultiplier = variant.physMultiplier
      art.attributeMultiplier = variant.attributeMultiplier
      art.physFixed = variant.physFixed
      art.attributeFixed = variant.attributeFixed
    }
    return art
  },
}

const BEHAVIOR_BY_SKILL_ID = new Map<string, SkillBehavior>()

export function registerSkillBehavior(skillId: string, behavior: SkillBehavior): void {
  BEHAVIOR_BY_SKILL_ID.set(skillId, behavior)
}

export function behaviorFor(skill: Skill): SkillBehavior {
  return BEHAVIOR_BY_SKILL_ID.get(skill.id) ?? DEFAULT_BEHAVIOR
}
