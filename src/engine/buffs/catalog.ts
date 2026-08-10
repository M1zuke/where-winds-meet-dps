import { catalogBuffDefs, dedupedMechanicBuffDefs, dedupedMechanicBuffDefsForClass } from "./data"
import { attuneTagOf, castTagOf, mysticCategoryOf, skillTagsOf } from "./tags"
import { matchesScope } from "../scope"
import { concentrationAvailable } from "../../data/classes/bellstrikeUmbraConcentration"
import { ATTUNEMENT_OPTIONS } from "../attunements"
import {
  MYSTIC_TYPE_BOOST_STAT_KEY,
  STAT_DEF_BY_KEY,
  WEAPON_BOOST_STAT_KEY,
  type StatKey,
} from "../statRegistry"
import type { BuffDef, BuffBonus, BuffStatMods } from "./buffDef"
import type { Skill } from "../skill"
import type { Debuff } from "../debuff"
import type { Inputs } from "../types"
import { paramsFromInputs } from "./params"
import type { BuffParams } from "./buffEngine"
import { INNER_WAY_BY_PARAM, SITE_SET_TO_APP_SET } from "./paramMap"
import { builtinDebuffsForClass } from "../builtinLibrary"

export interface BuffSummary {
  id: string
  name: string
  enabledParam?: string
  minTier?: number
  triggeredBy: string[]
  affects: string
  bonus: string
}

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

function affectsSummary(d: BuffDef): string {
  if (d.affectsProperty) return d.affectsProperty
  if (d.affectsWeaponTypes) return d.affectsWeaponTypes.join("/")
  if (d.affects === null || d.affects === undefined) return "all"
  return d.affects.join("/")
}

function toSummary(d: BuffDef): BuffSummary {
  return {
    id: d.id,
    name: d.name ?? d.id,
    enabledParam: d.enabledParam,
    minTier: d.minTier,
    triggeredBy: d.triggeredBy ?? [],
    affects: affectsSummary(d),
    bonus: bonusSummary(d.bonus),
  }
}

export function buffSummaries(classId?: string): BuffSummary[] {
  return catalogBuffDefs(classId)
    .map(toSummary)
    .sort((a, b) => a.name.localeCompare(b.name))
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

function humanize(param: string): string {
  const spaced = param.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  return spaced
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
}

export function requiresLabel(def: BuffDef): string | null {
  if (def.requiresSet) return SITE_SET_TO_APP_SET[def.requiresSet] ?? def.requiresSet
  if (!def.enabledParam) return null
  const innerWay = INNER_WAY_BY_PARAM[def.enabledParam]
  if (innerWay) return innerWay + (def.minTier ? ` tier ${def.minTier}+` : "")
  if (def.enabledParam === "starsAlignActive") return "Stars Align"
  return humanize(def.enabledParam) + (def.minTier ? ` T${def.minTier}+` : "")
}

function bonusAffectsTags(def: BuffDef, tagSet: Set<string>): boolean {
  return matchesScope(tagSet, def)
}

export function specMechanicDefIds(classId?: string): Set<string> {
  const defs = classId ? dedupedMechanicBuffDefsForClass(classId) : dedupedMechanicBuffDefs()
  return new Set(defs.filter((d) => d.alwaysActive).map((d) => d.id))
}

export function buffGateSatisfied(def: BuffDef, params: BuffParams): boolean {
  if (def.requiresSet && def.requiresSet !== params.armorSet) return false
  if (def.enabledParam && !params[def.enabledParam]) return false
  if (
    def.minTier &&
    def.enabledParam &&
    ((params[def.enabledParam + "Tier"] as number) ?? 0) < def.minTier
  )
    return false
  return true
}

const DISPLAY_ACTIVE_GATES: Record<string, (inputs: Inputs) => boolean> = {
  concentration: concentrationAvailable,
  vulnerabilityTeammate: (inputs) => !!inputs.shareEasyHurt,
}

const DISPLAY_REQUIRES: Record<string, string> = {
  vulnerabilityTeammate: "Encounter Settings: Tank Spear Debuff",
}

function triggeredByNote(def: BuffDef, defsById: Map<string, BuffDef>): string | null {
  if (def.alwaysActive) return null
  if (!def.triggeredBy || def.triggeredBy.length === 0) return null
  let note = `on cast: ${def.triggeredBy.join("/")}`
  const upgradeFrom = def.conditionalTrigger?.upgradeFromActive
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
  for (const def of defs) {
    const hasStatMods = !!(
      def.statModifiers ||
      def.tier6StatModifiers ||
      def.bossStatModifiers ||
      def.__statModByPrefix
    )
    let resolvedMods = def.statModifiers ?? null
    let statModApplies = hasStatMods
    if (def.__statModByPrefix) {
      const p = def.__statModByPrefix
      resolvedMods = matchesScope(tagSet, { affects: p.prefixes }) ? p.match : p.default
      statModApplies = resolvedMods != null
    }
    const bonusApplies = !!def.bonus && bonusAffectsTags(def, tagSet)
    if (!statModApplies && !bonusApplies) continue

    const parts: string[] = []
    const statPart = statModsSummary(resolvedMods)
    if (statPart) parts.push(statPart)
    if (def.bonus) {
      const bonusPart = bonusSummary(def.bonus)
      if (bonusPart) parts.push(bonusPart)
    }

    const displayGate = inputs ? DISPLAY_ACTIVE_GATES[def.id] : undefined
    const displayActive = displayGate ? displayGate(inputs!) : undefined

    rows.push({
      id: def.id,
      name: `${def.name ?? def.id} (${affectsSummary(def)})`,
      effect: parts.join(", "),
      requires: DISPLAY_REQUIRES[def.id] ?? requiresLabel(def),
      isSpecMechanic: specIds.has(def.id),
      active:
        displayActive !== undefined
          ? displayActive
          : params
            ? buffGateSatisfied(def, params)
            : true,
      triggeredBy: triggeredByNote(def, defsById),
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
  for (const def of catalogBuffDefs(classId)) {
    if (!def.triggeredBy || def.triggeredBy.length === 0) continue
    const triggered = def.triggeredBy.includes(castTag)
    if (!triggered) continue

    const parts: string[] = []
    const statPart = statModsSummary(def.statModifiers)
    if (statPart) parts.push(statPart)
    if (def.bonus) {
      const bonusPart = bonusSummary(def.bonus)
      if (bonusPart && bonusPart !== "—") parts.push(bonusPart)
    }

    rows.push({
      id: def.id,
      name: `${def.name ?? def.id} (${affectsSummary(def)})`,
      effect: parts.join(", "),
      requires: requiresLabel(def),
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
  for (const def of dedupedMechanicBuffDefsForClass(inputs.classId)) {
    if (!def.alwaysActive) continue
    if (def.enabledParam && !params[def.enabledParam]) continue
    if (
      def.minTier &&
      def.enabledParam &&
      ((params[def.enabledParam + "Tier"] as number) ?? 0) < def.minTier
    )
      continue
    const mods = def.__statModByPrefix?.match ?? def.statModifiers ?? null
    const parts: string[] = []
    const statPart = statModsSummary(mods)
    if (statPart) parts.push(statPart)
    const bonusPart = bonusSummary(def.bonus)
    if (bonusPart && bonusPart !== "—") parts.push(bonusPart)
    rows.push({
      id: def.id,
      name: def.name ?? def.id,
      effect: parts.join(", "),
      affects: affectsSummary(def),
      requires: requiresLabel(def),
    })
  }
  return rows
}
