// One place that answers "what is this class made of".
//
// A class module declares almost everything about itself (see `classDef.ts`'s
// `ClassDef`); the things that stay outside it are the built-in `Buff` gates
// (registered through `engine/builtinBuffs.ts` so a class can be looked up by
// id without importing its module directly — composed here from the class's
// own `gateBuffs` plus the gates every inner way it can slot declares, each
// stamped with this class's id), the attunement option list (global,
// because a saved gear piece must resolve its attunement id regardless of
// which class equipped it), and the composed `buffModules` list (every
// slottable inner way's `buffDefs` plus the class's own `classBuffDefs`).
// `classDefinition()` composes all three onto the declared `ClassDef` so
// callers read one shape either way.
import type { Buff } from "../../engine/buff"
import type { BuffModule } from "../../engine/buffs/buffModule"
import type { AttunementOption } from "../../engine/attunements"
import { attunementsForClass } from "../../engine/attunements"
import { builtinBuffsForClass, registerBuiltinBuffs } from "../../engine/builtinBuffs"
import type { ClassDef, RetunementPool } from "./classDef"
import { CLASSES } from "../../data/classes"
import { registerMechanic } from "../../engine/mechanics"
import { registerSkillBehavior } from "../../engine/behavior"
import { registerDisplayGate } from "../../engine/buffs/displayGates"
import { registerPoisonExtension } from "./poisonExtensions"
import { INNER_WAYS, innerWayDefinition } from "../innerWays/registry"
import type { InnerWayDef } from "../innerWays/innerWayDef"
import { martialArtDefinition } from "../martialArts/registry"
import type { MartialArtDef } from "../martialArts/martialArtDef"

function innerWayIdsOf(classDef: ClassDef): readonly string[] {
  return [...new Set([classDef.classMindGroup, ...classDef.allowedMindMethods].filter(Boolean))]
}

// `INNER_WAYS` barrel order, not the class's own `[classMindGroup,
// ...allowedMindMethods]` order — the barrel's own comment already pins that
// order as load-bearing for float summation, and reusing it means a class
// reordering `allowedMindMethods` can never reshuffle a buff-def sum.
export function innerWayDefsOf(classDef: ClassDef): readonly InnerWayDef[] {
  const ids = new Set(innerWayIdsOf(classDef))
  return INNER_WAYS.filter((def) => ids.has(def.id))
}

export function martialArtsOf(classDef: ClassDef): readonly MartialArtDef[] {
  return classDef.weapons
    .map((id) => martialArtDefinition(id))
    .filter((def): def is MartialArtDef => !!def)
}

for (const classDef of CLASSES) {
  const gateBuffs: Buff[] = [...classDef.gateBuffs]
  for (const innerWayId of innerWayIdsOf(classDef)) {
    for (const gate of innerWayDefinition(innerWayId)?.gateBuffs ?? [])
      gateBuffs.push({ ...gate, classId: classDef.id })
  }
  registerBuiltinBuffs(classDef.id, gateBuffs)
  for (const { mechanic, order } of classDef.mechanics) registerMechanic(mechanic, order)
  for (const { skillId, factory } of classDef.skillBehaviors)
    registerSkillBehavior(skillId, factory)
  for (const { defId, predicate } of classDef.displayGates) registerDisplayGate(defId, predicate)
  for (const { statusId, maxRemainingSec } of classDef.poisonExtensions)
    registerPoisonExtension(classDef.id, statusId, maxRemainingSec)
}

export function CLASS_DEFS(): readonly ClassDef[] {
  return CLASSES
}

export function CLASS_IDS(): readonly string[] {
  return CLASSES.map((classDef) => classDef.id)
}

export interface ClassDefinition extends ClassDef {
  // The class's own signature inner way, plus the ones it may slot alongside it.
  innerWays: readonly string[]
  martialArts: readonly MartialArtDef[]
  buffs: readonly Buff[]
  // Every slottable inner way's `buffDefs` plus the class's own
  // `classBuffDefs` — not `GLOBAL_BUFF_DEFS`, which `buffDefsForClass`
  // (`engine/buffs/data.ts`) folds in separately, between these two blocks.
  buffModules: readonly BuffModule[]
  attunements: readonly AttunementOption[]
}

const cache = new Map<string, ClassDefinition | null>()

export function classDefinition(classId: string): ClassDefinition | null {
  const cached = cache.get(classId)
  if (cached !== undefined) return cached

  const classDef = CLASSES.find((candidate) => candidate.id === classId)
  if (!classDef) {
    cache.set(classId, null)
    return null
  }

  const definition: ClassDefinition = {
    ...classDef,
    innerWays: innerWayIdsOf(classDef),
    martialArts: martialArtsOf(classDef),
    buffs: builtinBuffsForClass(classId),
    buffModules: [
      ...innerWayDefsOf(classDef).flatMap((def) => def.buffDefs ?? []),
      ...classDef.classBuffDefs,
    ],
    attunements: attunementsForClass(classId),
  }
  cache.set(classId, definition)
  return definition
}

export function poolForClass(classId: string): RetunementPool | null {
  return CLASSES.find((classDef) => classDef.id === classId)?.retunementPool ?? null
}

// The one place `BuildView.grantsMinPhysCritBoost` gets built from a class's
// `critBoostWeaponTypes` — `timeline.ts` and tests both read through this
// rather than re-deriving the Set-membership check themselves.
export function grantsMinPhysCritBoostFor(
  classId: string,
): (weaponType: string | undefined) => boolean {
  const types = new Set(classDefinition(classId)?.critBoostWeaponTypes ?? [])
  return (weaponType) => !!weaponType && types.has(weaponType)
}
