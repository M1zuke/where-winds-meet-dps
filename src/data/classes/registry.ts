// One place that answers "what is this class made of".
//
// A class module declares almost everything about itself (see `define.ts`'s
// `ClassDef`); the two things that stay outside it are the built-in `Buff`
// gates (registered through `engine/builtinBuffs.ts` so a class can be looked
// up by id without importing its module directly) and the attunement option
// list (global, because a saved gear piece must resolve its attunement id
// regardless of which class equipped it). `classDefinition()` composes both
// onto the declared `ClassDef` so callers read one shape either way.
import type { Buff } from "../../engine/buff"
import type { AttunementOption } from "../../engine/attunements"
import { attunementsForClass } from "../../engine/attunements"
import { builtinBuffsForClass } from "../../engine/builtinBuffs"
import type { ClassDef } from "./define"
import type { RetunementPool } from "./retunementPools"
import { classDefs } from "./classDefStore"
// Side-effect load, deliberately not a value import: `index.ts` assembles
// every class module and pushes the result into `classDefStore.ts`, rather
// than this file pulling it out of `index.ts` directly. `panel.ts` reads
// class metadata through this file, and the engine's own self-registering
// mechanics `index.ts` also loads (hawkwing.ts, bitterSeason.ts) import
// panel.ts — so this import closes a real cycle back to this file. That is
// harmless here: `classDefs` above comes from the dependency-free leaf store,
// not from `index.ts`, so whichever side of the cycle runs first still reads
// a correctly-typed (if possibly still-empty) array rather than a value that
// doesn't exist yet.
import "./index"

export { classDefs as CLASS_DEFS }

export function CLASS_IDS(): readonly string[] {
  return classDefs().map((classDef) => classDef.id)
}

export interface ClassDefinition extends ClassDef {
  // The class's own signature inner way, plus the ones it may slot alongside it.
  innerWays: readonly string[]
  buffs: readonly Buff[]
  attunements: readonly AttunementOption[]
}

const cache = new Map<string, ClassDefinition | null>()

export function classDefinition(classId: string): ClassDefinition | null {
  const cached = cache.get(classId)
  if (cached !== undefined) return cached

  const classDef = classDefs().find((candidate) => candidate.id === classId)
  if (!classDef) {
    cache.set(classId, null)
    return null
  }

  const definition: ClassDefinition = {
    ...classDef,
    innerWays: [
      ...new Set([classDef.classMindGroup, ...classDef.allowedMindMethods].filter(Boolean)),
    ],
    buffs: builtinBuffsForClass(classId),
    attunements: attunementsForClass(classId),
  }
  cache.set(classId, definition)
  return definition
}

export function poolForClass(classId: string): RetunementPool | null {
  return classDefs().find((classDef) => classDef.id === classId)?.retunementPool ?? null
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
