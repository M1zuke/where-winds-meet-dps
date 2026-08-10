// The built-in `Buff` pools, per class. A class registers its own from
// `src/data/classes/`; nothing here names a class.
//
// These are GATES the timeline reads — River Flow, the Zenith bar — not stat
// carriers, which is why their `effects` are empty.
import type { Buff } from "./buff"

const byClassId = new Map<string, Buff[]>()

export function registerBuiltinBuffs(classId: string, buffs: Buff[]): void {
  byClassId.set(classId, buffs)
}

export function builtinBuffsForClass(classId: string): Buff[] {
  return byClassId.get(classId) ?? []
}
