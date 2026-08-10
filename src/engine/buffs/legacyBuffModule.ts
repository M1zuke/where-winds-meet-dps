// The compiler from the 40-field `BuffDef` mini-DSL onto the one contract
// `BuffEngine` runs on. Every remaining `BuffDef` — the 35 not yet converted
// to a `BuffModule` — reaches the engine through this file and no other path.
//
// `consumableStackPool`'s stack-pool bookkeeping is the one thing that stays
// wholly engine-internal instead of becoming union members — `BuffEngine`
// reads it directly off `legacyDefOf(module)`, which is why this module
// exports that accessor rather than keeping the mapping private.
import type { StatKey } from "../statRegistry"
import type { BuffDef } from "./buffDef"
import { BONUS_TYPE_TO_STATKEY, statModsToEffects } from "./buffDef"
import { matchesScope } from "../scope"
import { readSkillProperty, type EffectContext } from "../effects/context"
import { stat, forceOutcome, applyBuff, consumeStacks, type Effect } from "../effects/effect"
import type { BuffModule, BuffRequirements } from "./buffModule"

export type LegacyBuffModule = BuffModule & { legacyDef: BuffDef }

export function legacyDefOf(module: BuffModule): BuffDef | undefined {
  return (module as Partial<LegacyBuffModule>).legacyDef
}

function requirementsOf(legacyDef: BuffDef): BuffRequirements | undefined {
  if (!legacyDef.enabledParam && !legacyDef.minTier && !legacyDef.requiresSet) return undefined
  return { param: legacyDef.enabledParam, minTier: legacyDef.minTier, set: legacyDef.requiresSet }
}

// `triggerPhaseGate` restricts which qi phase a trigger may fire in
// (`chargeEnhancement`'s only use, gated to `"exhausted"`) — evaluated with
// the CAST context, since it gates whether the trigger applies at all.
function triggerPhaseGateOk(legacyDef: BuffDef, ctx: EffectContext): boolean {
  const gate = legacyDef.triggerPhaseGate
  if (!gate) return true
  const phases = Array.isArray(gate) ? gate : [gate]
  return phases.includes(ctx.phase)
}

// `tierConditionalStacks` is the one place a per-cast stack grant or a stack
// cap depends on a build param's tier rather than being a fixed number —
// every other legacy def resolves to its plain `stacksPerCast` / `maxStacks`.
function tierGateOk(
  ctx: EffectContext,
  gate: { enabledParam?: string; minTier?: number },
): boolean {
  const paramOn = !gate.enabledParam || ctx.build.param(gate.enabledParam)
  const tierOk =
    !gate.minTier || !gate.enabledParam || ctx.build.paramTier(gate.enabledParam) >= gate.minTier
  return paramOn && tierOk
}

function legacyMaxStacks(legacyDef: BuffDef, ctx: EffectContext): number {
  const tierStacks = legacyDef.tierConditionalStacks as
    { enabledParam?: string; minTier?: number; maxStacks?: number } | undefined
  if (tierStacks?.maxStacks != null && tierGateOk(ctx, tierStacks)) return tierStacks.maxStacks
  return legacyDef.maxStacks ?? 1
}

function legacyStacksPerCast(legacyDef: BuffDef, ctx: EffectContext): number {
  const tierStacks = legacyDef.tierConditionalStacks as
    { enabledParam?: string; minTier?: number; stacksPerCast?: number } | undefined
  if (tierStacks?.stacksPerCast != null && tierGateOk(ctx, tierStacks))
    return tierStacks.stacksPerCast
  return legacyDef.stacksPerCast ?? 1
}

// `extendDurationToIfBuffActive` may raise the base duration further
// (`mountainSplitter`'s only remaining use). ONLY evaluated on the CAST
// event — the pre-conversion engine only ever computed it inside
// `processSkillCast`'s trigger branch, never from a refresh or a synthetic
// display-kind context. Evaluating it on any other event kind would grant a
// duration the old engine never did.
function legacyDuration(legacyDef: BuffDef, ctx: EffectContext): number {
  if (ctx.event.kind !== "cast") return legacyDef.duration ?? 15
  const extension = legacyDef.extendDurationToIfBuffActive
  const base = legacyDef.duration ?? 0
  if (
    extension &&
    tierGateOk(ctx, extension) &&
    ctx.status.isActive(extension.buffId) &&
    extension.targetDuration > base
  )
    return extension.targetDuration
  return legacyDef.duration ?? 15
}

function bonusValue(
  legacyDef: BuffDef,
  ctx: EffectContext,
  stacks: number,
): { statKey: StatKey; amount: number } | null {
  const bonus = legacyDef.bonus
  if (!bonus) return null
  const tags = (ctx.event.kind === "damage" ? ctx.event.tags : undefined) ?? new Set<string>()
  if (!matchesScope(tags, legacyDef)) return null
  if (legacyDef.overriddenBy && ctx.status.isActive(legacyDef.overriddenBy)) return null
  if (
    legacyDef.phaseGate &&
    bonus.type === "bossOnlyBuffBonus" &&
    ctx.phase !== legacyDef.phaseGate
  )
    return null

  const tier6 = legacyDef.enabledParam ? ctx.build.paramTier(legacyDef.enabledParam) >= 6 : false
  let value: number
  if (bonus.valuePerStack !== undefined) value = bonus.valuePerStack * stacks
  else if (bonus.valueFromParam) value = ctx.build.paramValue(bonus.valueFromParam)
  else
    value =
      legacyDef.tier6Value !== undefined &&
      legacyDef.enabledParam &&
      ctx.build.param(legacyDef.enabledParam) &&
      tier6
        ? legacyDef.tier6Value
        : (bonus.value ?? 0)
  if (bonus.phaseBonus) value += bonus.phaseBonus[ctx.phase] ?? 0
  if (value === 0) return null
  return { statKey: BONUS_TYPE_TO_STATKEY[bonus.type], amount: value }
}

// Literal transcription of `BuffEngine.calculateDamageEffects`'s per-def body
// (mods scaled by stacks, boss mods gated on `!isTrainingDummy`, `forceCrit`
// and `bonus` both gated by `matchesScope`, `__statModByPrefix` resolved
// against the damage tag set) — everything the *engine* used to decide before
// reaching this def (active-at-time, `minTier`, `excludes`) is done generically
// by `BuffEngine` before it calls `effects()`.
function damageEffects(
  legacyDef: BuffDef,
  ctx: EffectContext,
  event: Extract<EffectContext["event"], { kind: "damage" }>,
): Effect[] {
  const out: Effect[] = []
  const stacks = ctx.self.stacks

  let mods: BuffDef["statModifiers"] | null = legacyDef.statModifiers ?? null
  if (legacyDef.__statModByPrefix) {
    const prefixRule = legacyDef.__statModByPrefix
    mods = matchesScope(event.tags, { affects: prefixRule.prefixes })
      ? prefixRule.match
      : prefixRule.default
  }
  for (const statEffect of statModsToEffects(mods))
    out.push(stat(statEffect.statKey, statEffect.amount * stacks))
  if (legacyDef.bossStatModifiers && !ctx.target.isTrainingDummy) {
    for (const statEffect of statModsToEffects(legacyDef.bossStatModifiers))
      out.push(stat(statEffect.statKey, statEffect.amount * stacks))
  }

  if (legacyDef.forceCrit && matchesScope(event.tags, legacyDef)) out.push(forceOutcome("crit"))

  const bonus = bonusValue(legacyDef, ctx, stacks)
  if (bonus) out.push(stat(bonus.statKey, bonus.amount))
  return out
}

// Literal transcription of `activeBuffsForDisplay`'s per-id push body — a
// *different* precedence than the damage path on purpose (§ mechanic
// coverage in CALCULATION.md): `statModifiers` / `bossStatModifiers` are never
// stack-scaled here, and the bonus value falls back
// `value → valuePerStack → valueFromParam` with no `phaseBonus` and no
// `tier6Value`.
function displayEffects(legacyDef: BuffDef, ctx: EffectContext): Effect[] {
  const stacks = ctx.self.stacks
  const out: Effect[] = []
  for (const statEffect of statModsToEffects(legacyDef.statModifiers))
    out.push(stat(statEffect.statKey, statEffect.amount))
  for (const statEffect of statModsToEffects(legacyDef.bossStatModifiers))
    out.push(stat(statEffect.statKey, statEffect.amount))
  const bonus = legacyDef.bonus
  if (bonus) {
    const value =
      bonus.value ??
      (bonus.valuePerStack != null
        ? bonus.valuePerStack * stacks
        : bonus.valueFromParam
          ? ctx.build.paramValue(bonus.valueFromParam)
          : 0)
    if (value !== 0) out.push(stat(BONUS_TYPE_TO_STATKEY[bonus.type], value))
  }
  return out
}

// `onApply` / `onApplyFn` — the module's own "when I apply, also apply this"
// side effects. The three `__handler` names are data values out of
// `specMeta.json`; there are only three and none will ever gain a fourth
// generic case, so each is inlined here rather than looked up.
function onApplyEffects(legacyDef: BuffDef, ctx: EffectContext): Effect[] {
  const out: Effect[] = []
  for (const other of legacyDef.onApply ?? []) out.push(applyBuff(other))
  const handler = legacyDef.onApplyFn?.__handler
  if (handler === "lingeringBone") {
    if (ctx.build.param("starReacher")) {
      const target =
        ctx.phase === "exhausted"
          ? "starReacherExhausted"
          : ctx.phase === "below30"
            ? "starReacherBelow30"
            : "starReacherNormal"
      out.push(applyBuff(target))
    }
  } else if (handler === "throatPiercedDeflect") {
    out.push(applyBuff("throatPierced", 5))
  } else if (handler === "throatPiercedAnxiT6") {
    out.push(applyBuff("throatPierced", 1))
  }
  return out
}

// `perCastConsume` — consumes a stack from whichever candidate buff (the
// preferred sources in order, falling back to `consumesFromBuffStack`) is
// currently stacked, gated on the triggering skill property. `BuffEngine`
// drives the actual consumption from the `consumeStacks` effect this returns.
function perCastConsumeEffects(legacyDef: BuffDef, ctx: EffectContext): Effect[] {
  const rule = legacyDef.perCastConsume
  if (!rule || ctx.event.kind !== "cast") return []
  if (!readSkillProperty(ctx.event.props, rule.triggerSkillProperty)) return []
  let source: string | null = null
  for (const preferred of rule.preferredSources ?? []) {
    if (preferred.enabledParam && !ctx.build.param(preferred.enabledParam)) continue
    if (
      preferred.minTier &&
      preferred.enabledParam &&
      ctx.build.paramTier(preferred.enabledParam) < preferred.minTier
    )
      continue
    if (ctx.status.stacks(preferred.buffStack) > 0) {
      source = preferred.buffStack
      break
    }
  }
  if (!source && ctx.status.stacks(rule.consumesFromBuffStack) > 0)
    source = rule.consumesFromBuffStack
  return source ? [consumeStacks(source, 1)] : []
}

function castEffects(legacyDef: BuffDef, ctx: EffectContext): Effect[] {
  return [...onApplyEffects(legacyDef, ctx), ...perCastConsumeEffects(legacyDef, ctx)]
}

export function legacyBuffModule(legacyDef: BuffDef): LegacyBuffModule {
  return {
    id: legacyDef.id,
    name: legacyDef.name ?? legacyDef.id,
    specs: legacyDef.spec ? [legacyDef.spec] : undefined,
    requires: requirementsOf(legacyDef),
    affects: legacyDef.affects,
    affectsProperty: legacyDef.affectsProperty,
    affectsWeaponTypes: legacyDef.affectsWeaponTypes,
    excludes: legacyDef.excludes,
    triggeredBy: legacyDef.triggeredBy,
    alwaysActive: legacyDef.alwaysActive,
    buffAppliesOnCastEnd: legacyDef.buffAppliesOnCastEnd,
    maxStacks:
      legacyDef.maxStacks != null
        ? (ctx: EffectContext) => legacyMaxStacks(legacyDef, ctx)
        : undefined,
    cooldown: legacyDef.cooldown,
    rateLimit: legacyDef.rateLimit,
    stackRateLimit: legacyDef.stackRateLimit,
    stacksPerHit: !!legacyDef.stacksPerHit,
    requiresBuffActive: legacyDef.conditionalTrigger?.upgradeFromActive,
    when: legacyDef.triggerPhaseGate
      ? (ctx: EffectContext) => triggerPhaseGateOk(legacyDef, ctx)
      : undefined,
    duration: (ctx: EffectContext) => legacyDuration(legacyDef, ctx),
    stacks: (ctx: EffectContext) => legacyStacksPerCast(legacyDef, ctx),
    scopesItsOwnEffects: true,
    summary: legacyDef.name ?? legacyDef.id,
    effects: (ctx: EffectContext): Effect[] => {
      if (ctx.event.kind === "damage") return damageEffects(legacyDef, ctx, ctx.event)
      if (ctx.event.kind === "display") return displayEffects(legacyDef, ctx)
      return castEffects(legacyDef, ctx)
    },
    legacyDef,
  }
}
