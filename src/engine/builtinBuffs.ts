// The built-in `Buff` pools, per class. A class's pool is composed and
// registered by `src/definitions/classes/registry.ts` — the class's own
// gates from `src/data/classes/`, plus the gates of every inner way it can
// slot from `src/data/innerWays/`; nothing here names a class.
//
// These are GATES the timeline reads — River Flow, the Zenith bar — not stat
// carriers, which is why their `effects` are empty.
import type { Buff } from "./buff"

const byClassId = new Map<string, readonly Buff[]>()

export function registerBuiltinBuffs(classId: string, buffs: readonly Buff[]): void {
  byClassId.set(classId, buffs)
}

export function builtinBuffsForClass(classId: string): readonly Buff[] {
  return byClassId.get(classId) ?? []
}
