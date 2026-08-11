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
// than this file pulling it out of `index.ts` directly. This dates from when
// three engine-owned mechanics (Hawkwing, Bitter Season, Morale Chant)
// self-registered from `src/engine/mechanics/` and imported `panel.ts`, which
// reads class metadata through this file — a real cycle back to here. Those
// mechanics are now declared by their owning set/inner-way instead, and
// nothing left in `index.ts`'s dependency chain reaches `panel.ts`, so the
// cycle this store exists to break is gone (verified: no file under
// `src/data/classes` or its dependencies imports `engine/panel.ts`). Kept as
// a leaf for now rather than folded into a direct import — see
// `.plans/define-inner-way-followups.md`.
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
