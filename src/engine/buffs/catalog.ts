import { catalogBuffDefs } from "./data"
import { attuneTagOf, mysticCategoryOf, skillTagsOf } from "./tags"
import { reaches } from "../scope"
import { displayGateFor } from "./displayGates"
import { ATTUNEMENT_OPTIONS } from "../attunements"
import {
  MYSTIC_TYPE_BOOST_STAT_KEY,
  STAT_DEF_BY_KEY,
  WEAPON_BOOST_STAT_KEY,
  type StatKey,
} from "../statRegistry"
import type { BuffModule } from "./buffModule"
import type { Effect } from "../effects/effect"
import type { Skill } from "../skill"
import type { Debuff } from "../debuff"
import type { Inputs } from "../types"
import { paramOnOf, paramsFromInputs, paramTierOf } from "./params"
import type { BuffParams } from "./buffEngine"
import { innerWayForBuffParam } from "../../definitions/innerWays/registry"
import { setDisplayNameForSiteKey } from "../../definitions/sets/registry"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../builtinLibrary"
import { tickSourceSkillId } from "../dot"
import { CLASS_DEFS, classDefinition, innerWayDefsOf } from "../../definitions/classes/registry"
import { INNER_WAYS } from "../../definitions/innerWays/registry"
import type { BuffStatEffect } from "../buff"

function skillsInScope(classId: string | undefined, inputs: Inputs | undefined): Skill[] {
  return [...builtinSkillsForClass(classId ?? ""), ...(inputs?.customSkills ?? [])]
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

function moduleContribution(
  module: BuffModule,
  tagSet: Set<string>,
): { applies: boolean; text: string } {
  const applies = reaches(tagSet, module)
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
  const innerWayName = innerWayForBuffParam(requires.param)?.name
  if (innerWayName) return innerWayName + (requires.minTier ? ` tier ${requires.minTier}+` : "")
  return humanize(requires.param) + (requires.minTier ? ` T${requires.minTier}+` : "")
}

// Both scoped to the class's OWN `classBuffDefs` — never `buffDefsForClass`'s
// composed set, which folds in `GLOBAL_BUFF_DEFS`. `dragonHeadLowHp` is a
// global and `alwaysActive`, so widening there would newly hide a timeline
// chip that shows today.
function ownBuffDefsFor(classId?: string): readonly BuffModule[] {
  if (!classId) return CLASS_DEFS().flatMap((classDef) => classDef.classBuffDefs)
  return classDefinition(classId)?.classBuffDefs ?? []
}

// The Skill Editor's "Spec Mechanics" column: a row belongs there because
// the class itself declares the def, not because of any property on it.
export function specMechanicIds(classId?: string): Set<string> {
  return new Set(ownBuffDefsFor(classId).map((module) => module.id))
}

// The rotation editor's per-cast chip suppression: narrower than the column
// above, the `alwaysActive` subset only.
export function hiddenTimelineBuffIds(classId?: string): Set<string> {
  return new Set(
    ownBuffDefsFor(classId)
      .filter((module) => module.alwaysActive)
      .map((module) => module.id),
  )
}

export function buffGateSatisfied(module: BuffModule, params: BuffParams): boolean {
  const requires = module.requires
  if (requires?.set && requires.set !== params.armorSet) return false
  if (requires?.param && !paramOnOf(params, requires.param)) return false
  if (requires?.minTier && requires.param && paramTierOf(params, requires.param) < requires.minTier)
    return false
  return true
}

const DISPLAY_REQUIRES: Record<string, string> = {
  vulnerabilityTeammate: "Encounter Settings: Tank Spear Debuff",
}

export interface ReceivesRow {
  id: string
  name: string
  effect: string
  requires: string | null
  isSpecMechanic: boolean
  active: boolean
}

// A mechanic's Receives row, derived from the very `effects` it applies so the
// card cannot drift from the engine, and labelled with the inner way that
// declares it. A mechanic is never one of the class's own defs, so it never
// counts as a spec mechanic. Every mechanic that carries a catalog row reaches
// every skill — there is no scoped one.
function mechanicRows(classId?: string, inputs?: Inputs): ReceivesRow[] {
  const definition = classId ? classDefinition(classId) : undefined
  const rows: ReceivesRow[] = []
  for (const owner of definition ? innerWayDefsOf(definition) : INNER_WAYS) {
    for (const { mechanic } of owner.mechanics ?? []) {
      const row = mechanic.catalogRow
      if (!row) continue
      rows.push({
        id: mechanic.id,
        name: row.name,
        effect: summaryFromMechanicEffects(row.effects()),
        requires: owner.name,
        isSpecMechanic: false,
        active: inputs ? row.available(inputs) : true,
      })
    }
  }
  return rows
}

function summaryFromMechanicEffects(effects: readonly BuffStatEffect[]): string {
  return effects
    .map(
      (effect) =>
        `${STAT_DEF_BY_KEY[effect.statKey]?.label ?? effect.statKey} ` +
        `${effect.amount >= 0 ? "+" : ""}${(effect.amount * 100).toFixed(1)}%`,
    )
    .join(", ")
}

function gearStatRow(key: StatKey, inputs?: Inputs): ReceivesRow {
  const label = STAT_DEF_BY_KEY[key]?.label ?? key
  const value = inputs ? ((inputs as unknown as Record<string, number>)[key] ?? 0) : null
  return {
    id: `stat:${key}`,
    name: label,
    effect: value !== null ? `+${(value * 100).toFixed(1)}% damage` : "panel stat",
    requires: null,
    isSpecMechanic: false,
    active: true,
  }
}

export function receivesForSkill(skill: Skill, classId?: string, inputs?: Inputs): ReceivesRow[] {
  const tagSet = skillTagsOf(skill)
  const specIds = specMechanicIds(classId)
  const params = inputs ? paramsFromInputs(inputs) : null
  const defs = catalogBuffDefs(classId)
  const rows: ReceivesRow[] = []
  for (const module of defs) {
    const { applies, text } = moduleContribution(module, tagSet)
    if (!applies) continue

    const displayGate = inputs ? displayGateFor(module.id) : undefined
    const displayActive = displayGate ? displayGate(inputs!) : undefined

    rows.push({
      id: module.id,
      name: module.name,
      effect: text,
      requires: DISPLAY_REQUIRES[module.id] ?? requiresLabel(module),
      isSpecMechanic: specIds.has(module.id),
      active:
        displayActive !== undefined
          ? displayActive
          : params
            ? buffGateSatisfied(module, params)
            : true,
    })
  }
  rows.push(...mechanicRows(classId, inputs))

  const weaponBoostKey = WEAPON_BOOST_STAT_KEY[skill.weaponOrAttribute ?? ""]
  if (weaponBoostKey) {
    rows.push(gearStatRow(weaponBoostKey, inputs))
    rows.push(gearStatRow("allMartialBoost", inputs))
  }
  const mysticCategory = mysticCategoryOf(skill)
  const mysticBoostKey = MYSTIC_TYPE_BOOST_STAT_KEY[mysticCategory]
  if (mysticBoostKey) {
    rows.push(gearStatRow(mysticBoostKey, inputs))
  }
  const attuneTag = attuneTagOf(skill)
  const attunement = attuneTag
    ? ATTUNEMENT_OPTIONS.find((option) => option.affectsTag === attuneTag)
    : undefined
  if (attunement?.enginePath) {
    const rolled = inputs?.classSpecificAttunement[attunement.id] ?? 0
    const forThisClass = !attunement.classIds || !classId || attunement.classIds.includes(classId)
    rows.push({
      id: `attunement:${attunement.id}`,
      name: attunement.label,
      effect: inputs ? `+${(rolled * 100).toFixed(1)}% damage` : "gear attunement",
      requires: `${attunement.slots.join("/")} attunement`,
      isSpecMechanic: false,
      active: forThisClass && rolled > 0,
    })
  }

  if (classId) {
    const debuffsById = new Map<string, Debuff>()
    for (const d of builtinDebuffsForClass(classId)) debuffsById.set(d.id, d)
    for (const d of inputs?.customDebuffs ?? []) debuffsById.set(d.id, d)
    for (const d of debuffsById.values()) {
      const det = d.detonation
      if (!det?.retainParam || tickSourceSkillId(d) !== skill.id) continue
      const innerWayLabel = innerWayForBuffParam(det.retainParam)?.name ?? humanize(det.retainParam)
      const minTier = det.retainMinTier ?? 6
      const retained = det.retainParamStacks ?? det.retainStacks ?? 0
      const baseline = det.retainStacks ?? 0
      rows.push({
        id: `dotRetention:${d.id}`,
        name: innerWayLabel,
        effect: `retains ${retained} ${d.name} stacks after detonation (${baseline} without it)`,
        requires: `${innerWayLabel} tier ${minTier}+`,
        isSpecMechanic: false,
        active: params
          ? paramOnOf(params, det.retainParam) && paramTierOf(params, det.retainParam) >= minTier
          : true,
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
  if (!skill.triggersBuffs || skill.triggersBuffs.length === 0) return []
  const defsById = new Map(catalogBuffDefs(classId).map((module) => [module.id, module] as const))
  const rows: AppliesRow[] = []
  for (const buffId of new Set(skill.triggersBuffs)) {
    const module = defsById.get(buffId)
    if (!module) continue

    const parts: string[] = []
    if (module.summary) {
      parts.push(module.summary)
    } else if (Array.isArray(module.effects)) {
      const text = summaryFromStaticEffects(module.effects)
      if (text) parts.push(text)
    }

    rows.push({
      id: module.id,
      name: module.name,
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
  requires: string | null
}

// The column lists defs that scope themselves to specific skills; an unscoped
// def applies to the whole build and is shown on the skills it triggers from
// instead (an Applies row — see `appliesForSkill`).
function hasScope(module: BuffModule, skills: readonly Skill[]): boolean {
  if (module.affectsAll) return false
  return skills.some((skill) => skill.receives?.includes(module.id))
}

// `classBuffDefs`, not the composed `buffModules`: a buff an inner way owns is
// the inner way's, and reading it under a class heading credits it to whichever
// class happens to slot that inner way. Being gated on an inner way is a
// different thing and stays — the row names the gate in `requires`.
export function alwaysActiveClassBuffs(inputs: Inputs): ClassBuffRow[] {
  const params = paramsFromInputs(inputs)
  const classDef = classDefinition(inputs.classId)
  const byId = new Map<string, BuffModule>()
  for (const module of classDef?.classBuffDefs ?? []) byId.set(module.id, module)
  const skills = skillsInScope(inputs.classId, inputs)
  const rows: ClassBuffRow[] = []
  for (const module of byId.values()) {
    if (!hasScope(module, skills)) continue
    if (module.requires?.param && !paramOnOf(params, module.requires.param)) continue
    if (
      module.requires?.minTier &&
      module.requires.param &&
      paramTierOf(params, module.requires.param) < module.requires.minTier
    )
      continue
    const parts: string[] = []
    if (module.summary) {
      parts.push(module.summary)
    } else if (Array.isArray(module.effects)) {
      const text = summaryFromStaticEffects(module.effects)
      if (text) parts.push(text)
    }
    rows.push({
      id: module.id,
      name: module.name,
      effect: parts.join(", "),
      requires: requiresLabel(module),
    })
  }
  return rows
}
