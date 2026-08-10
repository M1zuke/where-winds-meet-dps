import { catalogBuffDefs, dedupedMechanicBuffDefs, dedupedMechanicBuffDefsForClass } from "./data"
import { attuneTagOf, castTagOf, mysticCategoryOf, skillTagsOf } from "./tags"
import { matchesScope } from "../scope"
import { displayGateFor } from "./displayGates"
import { ATTUNEMENT_OPTIONS } from "../attunements"
import {
  MYSTIC_TYPE_BOOST_STAT_KEY,
  STAT_DEF_BY_KEY,
  WEAPON_BOOST_STAT_KEY,
  type StatKey,
} from "../statRegistry"
import type { BuffBonus, BuffStatMods } from "./buffDef"
import type { BuffModule } from "./buffModule"
import { legacyDefOf } from "./legacyBuffModule"
import type { Effect } from "../effects/effect"
import type { Skill } from "../skill"
import type { Debuff } from "../debuff"
import type { Inputs } from "../types"
import { paramsFromInputs } from "./params"
import type { BuffParams } from "./buffEngine"
import { INNER_WAY_BY_PARAM } from "./paramMap"
import { setDisplayNameForSiteKey } from "../../data/sets"
import { builtinDebuffsForClass } from "../builtinLibrary"

function bonusSummary(b?: BuffBonus | null): string {
  if (!b) return "—"
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`
  const label =
    b.type === "phyBoostMod"
      ? "phys"
      : b.type === "bossOnlyBuffBonus"
        ? "boss"
        : b.type === "groupDamage"
          ? "all (team)"
          : "all"
  if (b.valuePerStack !== undefined) return `+${pct(b.valuePerStack)} ${label}/stack`
  if (b.valueFromParam) return `+${label} (from ${b.valueFromParam})`
  return `+${pct(b.value ?? 0)} ${label}`
}

function affectsSummary(module: BuffModule): string {
  if (module.affectsProperty) return module.affectsProperty
  if (module.affectsWeaponTypes) return module.affectsWeaponTypes.join("/")
  if (module.affects === null || module.affects === undefined) return "all"
  return module.affects.join("/")
}

const POINT_VALUED_MODS = new Set<keyof BuffStatMods>(["physPen", "bellstrikePen"])

export function statModsSummary(mods: BuffStatMods | null | undefined): string {
  if (!mods) return ""
  const parts: string[] = []
  for (const k of Object.keys(mods) as (keyof BuffStatMods)[]) {
    const v = mods[k]
    if (typeof v !== "number" || v === 0) continue
    const formatted = POINT_VALUED_MODS.has(k) ? `${v}` : `${(v * 100).toFixed(0)}%`
    parts.push(`${k} ${v >= 0 ? "+" : ""}${formatted}`)
  }
  return parts.join(", ")
}

// A native module's `effects` static array carries no bonus "type" (team vs
// solo, phys vs all) beyond its `StatKey`, so it is read back off that key —
// every buff converted so far picks a key `BONUS_TYPE_TO_STATKEY` only ever
// produces from one bonus type, so this is lossless for all of them.
const STATKEY_BONUS_LABEL: Partial<Record<StatKey, string>> = {
  allDamageBoost: "all",
  physBoost: "phys",
  bossBoost: "boss",
}
const STATKEY_POINT_VALUED = new Set<StatKey>(["phys.penetration", "bellstrike.penetration"])

function summaryFromStaticEffects(effects: Effect[]): string {
  const parts: string[] = []
  for (const effect of effects) {
    if (effect.kind !== "stat") continue
    const bonusLabel = STATKEY_BONUS_LABEL[effect.statKey]
    if (bonusLabel) {
      parts.push(`+${(effect.amount * 100).toFixed(1)}% ${bonusLabel}`)
      continue
    }
    const formatted = STATKEY_POINT_VALUED.has(effect.statKey)
      ? `${effect.amount / 0.01}`
      : `${(effect.amount * 100).toFixed(0)}%`
    parts.push(`${effect.statKey} ${effect.amount >= 0 ? "+" : ""}${formatted}`)
  }
  return parts.join(", ")
}

// `receivesForSkill` asks "does this module contribute to this tag set, and
// what does it read as" — a legacy-adapted module answers with the exact old
// `BuffDef` field reading (so its text is byte-identical to before
// conversion); a native module prefers its author-written `summary` when one
// is given, and otherwise derives text from its static `effects` array.
// `appliesForSkill` and `alwaysActiveClassBuffs` do NOT share this: each reads
// a different, narrower field set today (no `__statModByPrefix` resolution in
// the former, `__statModByPrefix?.match` only — no tag-scope resolution — in
// the latter), and folding them in here would change their emitted strings.
function moduleContribution(
  module: BuffModule,
  tagSet: Set<string>,
): { applies: boolean; text: string } {
  const legacy = legacyDefOf(module)
  if (legacy) {
    const hasStatMods = !!(
      legacy.statModifiers ||
      legacy.bossStatModifiers ||
      legacy.__statModByPrefix
    )
    let resolvedMods = legacy.statModifiers ?? null
    let statModApplies = hasStatMods
    if (legacy.__statModByPrefix) {
      const prefixRule = legacy.__statModByPrefix
      resolvedMods = matchesScope(tagSet, { affects: prefixRule.prefixes })
        ? prefixRule.match
        : prefixRule.default
      statModApplies = resolvedMods != null
    }
    const bonusApplies = !!legacy.bonus && matchesScope(tagSet, legacy)
    const parts: string[] = []
    const statPart = statModsSummary(resolvedMods)
    if (statPart) parts.push(statPart)
    if (legacy.bonus) {
      const bonusPart = bonusSummary(legacy.bonus)
      if (bonusPart && bonusPart !== "—") parts.push(bonusPart)
    }
    return { applies: statModApplies || bonusApplies, text: parts.join(", ") }
  }
  const applies = matchesScope(tagSet, module)
  const text =
    module.summary ??
    (Array.isArray(module.effects) ? summaryFromStaticEffects(module.effects) : "")
  return { applies, text }
}

function humanize(param: string): string {
  const spaced = param.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  return spaced
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
}

export function requiresLabel(module: BuffModule): string | null {
  const requires = module.requires
  if (requires?.set) return setDisplayNameForSiteKey(requires.set) ?? requires.set
  if (!requires?.param) return null
  const innerWay = INNER_WAY_BY_PARAM[requires.param]
  if (innerWay) return innerWay + (requires.minTier ? ` tier ${requires.minTier}+` : "")
  if (requires.param === "starsAlignActive") return "Stars Align"
  return humanize(requires.param) + (requires.minTier ? ` T${requires.minTier}+` : "")
}

export function specMechanicDefIds(classId?: string): Set<string> {
  const defs = classId ? dedupedMechanicBuffDefsForClass(classId) : dedupedMechanicBuffDefs()
  return new Set(defs.filter((d) => d.alwaysActive).map((d) => d.id))
}

export function buffGateSatisfied(module: BuffModule, params: BuffParams): boolean {
  const requires = module.requires
  if (requires?.set && requires.set !== params.armorSet) return false
  if (requires?.param && !params[requires.param]) return false
  if (
    requires?.minTier &&
    requires.param &&
    ((params[requires.param + "Tier"] as number) ?? 0) < requires.minTier
  )
    return false
  return true
}

const DISPLAY_REQUIRES: Record<string, string> = {
  vulnerabilityTeammate: "Encounter Settings: Tank Spear Debuff",
}

function triggeredByNote(module: BuffModule, defsById: Map<string, BuffModule>): string | null {
  if (module.alwaysActive) return null
  if (!module.triggeredBy || module.triggeredBy.length === 0) return null
  let note = `on cast: ${module.triggeredBy.join("/")}`
  const upgradeFrom = module.requiresBuffActive
  if (upgradeFrom) {
    const src = defsById.get(upgradeFrom)
    note += ` · requires ${src?.name ?? upgradeFrom} active`
  }
  return note
}

export interface ReceivesRow {
  id: string
  name: string
  effect: string
  requires: string | null
  isSpecMechanic: boolean
  active: boolean
  triggeredBy: string | null
}

function gearStatRow(key: StatKey, affects: string, inputs?: Inputs): ReceivesRow {
  const label = STAT_DEF_BY_KEY[key]?.label ?? key
  const value = inputs ? ((inputs as unknown as Record<string, number>)[key] ?? 0) : null
  return {
    id: `stat:${key}`,
    name: `${label} (${affects})`,
    effect: value !== null ? `+${(value * 100).toFixed(1)}% damage` : "panel stat",
    requires: null,
    isSpecMechanic: false,
    active: true,
    triggeredBy: null,
  }
}

export function receivesForSkill(skill: Skill, classId?: string, inputs?: Inputs): ReceivesRow[] {
  const tagSet = skillTagsOf(skill)
  const specIds = specMechanicDefIds(classId)
  const params = inputs ? paramsFromInputs(inputs) : null
  const defs = catalogBuffDefs(classId)
  const defsById = new Map(defs.map((d) => [d.id, d] as const))
  const rows: ReceivesRow[] = []
  for (const module of defs) {
    const { applies, text } = moduleContribution(module, tagSet)
    if (!applies) continue

    const displayGate = inputs ? displayGateFor(module.id) : undefined
    const displayActive = displayGate ? displayGate(inputs!) : undefined

    rows.push({
      id: module.id,
      name: `${module.name} (${affectsSummary(module)})`,
      effect: text,
      requires: DISPLAY_REQUIRES[module.id] ?? requiresLabel(module),
      isSpecMechanic: specIds.has(module.id),
      active:
        displayActive !== undefined
          ? displayActive
          : params
            ? buffGateSatisfied(module, params)
            : true,
      triggeredBy: triggeredByNote(module, defsById),
    })
  }

  const weaponBoostKey = WEAPON_BOOST_STAT_KEY[skill.weaponOrAttribute ?? ""]
  if (weaponBoostKey) {
    rows.push(gearStatRow(weaponBoostKey, `${skill.weaponOrAttribute} skills`, inputs))
    rows.push(gearStatRow("allMartialBoost", "all weapon-typed skills", inputs))
  }
  const mysticCategory = mysticCategoryOf(skill)
  const mysticBoostKey = MYSTIC_TYPE_BOOST_STAT_KEY[mysticCategory]
  if (mysticBoostKey) {
    rows.push(gearStatRow(mysticBoostKey, `mystic: ${mysticCategory}`, inputs))
  }
  const attuneTag = attuneTagOf(skill)
  const attunement = attuneTag
    ? ATTUNEMENT_OPTIONS.find((option) => option.affectsTag === attuneTag)
    : undefined
  if (attunement?.enginePath) {
    const rolled = inputs?.dingYinByTag[attunement.enginePath.slice("dingYinByTag.".length)] ?? 0
    const forThisClass = !attunement.classIds || !classId || attunement.classIds.includes(classId)
    rows.push({
      id: `attunement:${attunement.id}`,
      name: `${attunement.label} (${attuneTag})`,
      effect: inputs ? `+${(rolled * 100).toFixed(1)}% damage` : "gear attunement",
      requires: `${attunement.slots.join("/")} attunement`,
      isSpecMechanic: false,
      active: forThisClass && rolled > 0,
      triggeredBy: null,
    })
  }

  if (classId) {
    const debuffsById = new Map<string, Debuff>()
    for (const d of builtinDebuffsForClass(classId)) debuffsById.set(d.id, d)
    for (const d of inputs?.customDebuffs ?? []) debuffsById.set(d.id, d)
    for (const d of debuffsById.values()) {
      const det = d.detonation
      if (!det?.retainParam || d.name !== skill.name) continue
      const innerWay = INNER_WAY_BY_PARAM[det.retainParam] ?? humanize(det.retainParam)
      const minTier = det.retainMinTier ?? 6
      const retained = det.retainParamStacks ?? det.retainStacks ?? 0
      const baseline = det.retainStacks ?? 0
      rows.push({
        id: `dotRetention:${d.id}`,
        name: `${innerWay} (${d.name})`,
        effect: `retains ${retained} ${d.name} stacks after detonation (${baseline} without it)`,
        requires: `${innerWay} tier ${minTier}+`,
        isSpecMechanic: false,
        active: params
          ? !!params[det.retainParam] &&
            ((params[det.retainParam + "Tier"] as number) ?? 0) >= minTier
          : true,
        triggeredBy: null,
      })
    }
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

export interface AppliesRow {
  id: string
  name: string
  effect: string
  requires: string | null
}

export function appliesForSkill(skill: Skill, classId?: string): AppliesRow[] {
  const castTag = castTagOf(skill)
  if (!castTag) return []
  const rows: AppliesRow[] = []
  for (const module of catalogBuffDefs(classId)) {
    if (!module.triggeredBy || module.triggeredBy.length === 0) continue
    const triggered = module.triggeredBy.includes(castTag)
    if (!triggered) continue

    const legacy = legacyDefOf(module)
    const parts: string[] = []
    if (legacy) {
      const statPart = statModsSummary(legacy.statModifiers)
      if (statPart) parts.push(statPart)
      if (legacy.bonus) {
        const bonusPart = bonusSummary(legacy.bonus)
        if (bonusPart && bonusPart !== "—") parts.push(bonusPart)
      }
    } else if (module.summary) {
      parts.push(module.summary)
    } else if (Array.isArray(module.effects)) {
      const text = summaryFromStaticEffects(module.effects)
      if (text) parts.push(text)
    }

    rows.push({
      id: module.id,
      name: `${module.name} (${affectsSummary(module)})`,
      effect: parts.join(", "),
      requires: requiresLabel(module),
    })
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

export interface ClassBuffRow {
  id: string
  name: string
  effect: string
  affects: string
  requires: string | null
}

export function alwaysActiveClassBuffs(inputs: Inputs): ClassBuffRow[] {
  const params = paramsFromInputs(inputs)
  const rows: ClassBuffRow[] = []
  for (const module of dedupedMechanicBuffDefsForClass(inputs.classId)) {
    if (!module.alwaysActive) continue
    if (module.requires?.param && !params[module.requires.param]) continue
    if (
      module.requires?.minTier &&
      module.requires.param &&
      ((params[module.requires.param + "Tier"] as number) ?? 0) < module.requires.minTier
    )
      continue
    const legacy = legacyDefOf(module)
    const parts: string[] = []
    if (legacy) {
      const mods = legacy.__statModByPrefix?.match ?? legacy.statModifiers ?? null
      const statPart = statModsSummary(mods)
      if (statPart) parts.push(statPart)
      const bonusPart = bonusSummary(legacy.bonus)
      if (bonusPart && bonusPart !== "—") parts.push(bonusPart)
    } else if (module.summary) {
      parts.push(module.summary)
    } else if (Array.isArray(module.effects)) {
      const text = summaryFromStaticEffects(module.effects)
      if (text) parts.push(text)
    }
    rows.push({
      id: module.id,
      name: module.name,
      effect: parts.join(", "),
      affects: affectsSummary(module),
      requires: requiresLabel(module),
    })
  }
  return rows
}
