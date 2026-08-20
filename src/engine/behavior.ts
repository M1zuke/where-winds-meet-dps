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
import type { computeSkillDamage } from "./formula"
import { WEAPON_TAG } from "./buffs/tags"
import { damageMultiplier, type ArtEffect, type HitEffect } from "./effects/effect"

export type ArtRow = Parameters<typeof computeSkillDamage>[0]

// The build, as a skill is allowed to see it: what was chosen, never the whole
// mutable `Inputs`.
export interface BuildView {
  classId: string
  innerWayTier(name: string): number | null
  classSpecificAttunement(attunementId: string): number
  grantsMinPhysCritBoost(weaponType: string | undefined): boolean
}

export interface HitInput {
  skill: Skill
  hit: SkillHit
  frame: number
  statuses: StatusView
  build: BuildView
  holds(condition: TriggerCondition): boolean
}

export type QiPhase = "normal" | "below30" | "exhausted"

// What is true of the fight at this hit, as opposed to of the build.
export interface HitContext {
  phase: QiPhase
  qiBreakEnabled: boolean
  // The food-free base min phys, read off the RESOLVED context — which is why
  // `buildArt`/`patchArt` run after it is built and stat claims run before.
  smallPhys: number
  isEngineBuffActive(id: string): boolean
}

export interface SkillBehavior {
  // Runs AFTER the formula context is built, since the crit-damage sentinel
  // resolution below reads `context.smallPhys` off it.
  buildArt(input: HitInput, context: HitContext): ArtRow
  chooseVariant(input: HitInput): HitVariant | null
  // Runs BEFORE the formula context is built, because what it returns can
  // change that context.
  claimStatEffects(input: HitInput, phase: QiPhase): HitEffect[]
  // Applied onto the row `buildArt` returned — additively for `artBonus`,
  // multiplicatively into `correction` for `damageMultiplier`.
  patchArt(input: HitInput, context: HitContext): ArtEffect[]
  // Runs BEFORE the formula context is built, same reason as
  // `claimStatEffects`. Anything stateful lives on the instance, which is why
  // behaviours are built per simulation rather than shared.
  onHit?(input: HitInput): HitEffect[]
}

// "If the skill hits a non-player target without Qi or with depleted Qi, the
// damage dealt is doubled" (Dragon Head - Plus, official text in
// `reference/locale/zhToEnOfficial.json`). Depleted Qi is the qi-break window;
// the sim has no "target has no Qi bar at all" state, so only the window
// triggers it. Multiplicative on top of (1+H), hence `damageMultiplier` into
// `correction` rather than an allDamageBoost effect — a +1.0 boost would be
// diluted by the additive pool.
const QI_BREAK_DOUBLE_TAG = "prop:hasQiBreakDoubleDamage"
const QI_BREAK_DAMAGE_MULTIPLIER = 2

// A built-in hit's `extraCritDamage === 1` is a boolean GATE, not a damage
// amount — it carries the source catalog's `critBoost` straight through, and
// that is always 0/1/absent. When the gate passes (a weapon-type match
// against the class's declared `critBoostWeaponTypes`, read through
// `BuildView.grantsMinPhysCritBoost`) the real term is
// `floor(min(minPhys, 750) / 50) * 0.024`, capped at +0.36. Resolved here,
// not as a `patchArt` effect: it REPLACES the hit's own coefficient, it does
// not add to it.
export const MIN_PHYS_CRIT_BONUS_SENTINEL = 1
const MIN_PHYS_CRIT_CAP = 750
const MIN_PHYS_CRIT_STEP = 50
const MIN_PHYS_CRIT_PER_STEP = 0.024

// The real term the sentinel stands for. Exported because a DoT tick resolves
// it too, and the two paths must not drift.
export function minPhysCritBonus(smallPhys: number): number {
  return (
    Math.floor(Math.min(Math.max(0, smallPhys), MIN_PHYS_CRIT_CAP) / MIN_PHYS_CRIT_STEP) *
    MIN_PHYS_CRIT_PER_STEP
  )
}

export const DEFAULT_BEHAVIOR: SkillBehavior = {
  chooseVariant(input) {
    return selectHitVariant(input.hit, input.holds)
  },

  claimStatEffects() {
    return []
  },

  patchArt(input, context) {
    const tags = input.skill.tags
    if (!tags || tags.length === 0) return []
    const effects: ArtEffect[] = []

    if (
      context.phase === "exhausted" &&
      context.qiBreakEnabled &&
      tags.includes(QI_BREAK_DOUBLE_TAG)
    ) {
      effects.push(damageMultiplier(QI_BREAK_DAMAGE_MULTIPLIER))
    }
    return effects
  },
  buildArt(input, context) {
    const art = hitToArtRow(input.hit, input.skill)
    const variant = this.chooseVariant(input)
    if (variant) {
      art.physMultiplier = variant.physMultiplier
      art.attributeMultiplier = variant.attributeMultiplier
      art.physFixed = variant.physFixed
      art.attributeFixed = variant.attributeFixed
    }
    // A tagless skill never resolves the sentinel — matches the pre-fold
    // behaviour, where `patchArt` returned early on `!tags.length` before
    // ever reaching this branch, leaving the raw `1` in the art row.
    const tags = input.skill.tags
    if (tags && tags.length > 0 && input.hit.extraCritDamage === MIN_PHYS_CRIT_BONUS_SENTINEL) {
      const weaponType = tags.find((tag) => tag.startsWith(WEAPON_TAG))?.slice(WEAPON_TAG.length)
      art.extraCritDamage = input.build.grantsMinPhysCritBoost(weaponType)
        ? minPhysCritBonus(context.smallPhys)
        : 0
    }
    return art
  },
}

// Factories, not instances: a behaviour with state — a charge counter, a
// cooldown — must not carry it between simulations, and the engine runs many
// per input change (gear ranking, full-potential, the worker).
export type SkillBehaviorFactory = (build: BuildView) => SkillBehavior | null

export interface SkillBehaviorRegistration {
  skillId: string
  factory: SkillBehaviorFactory
}

const FACTORY_BY_SKILL_ID = new Map<string, SkillBehaviorFactory>()

export function registerSkillBehavior(skillId: string, factory: SkillBehaviorFactory): void {
  FACTORY_BY_SKILL_ID.set(skillId, factory)
}

// Built once per simulation. A factory returning null means the skill takes the
// default this run — how a mechanic gates itself on the build without the
// timeline knowing why.
export function buildBehaviors(build: BuildView): (skill: Skill) => SkillBehavior {
  const bySkillId = new Map<string, SkillBehavior>()
  for (const [skillId, factory] of FACTORY_BY_SKILL_ID) {
    const behavior = factory(build)
    if (behavior) bySkillId.set(skillId, behavior)
  }
  return (skill) => bySkillId.get(skill.id) ?? DEFAULT_BEHAVIOR
}
