// A cycle-free leaf, mirroring `src/data/classes/classDefStore.ts`: this file
// imports nothing but a type (erased at runtime). `bitterSeasonMechanic.ts`
// reads it directly, rather than through `registry.ts` — `registry.ts` itself
// unconditionally loads the inner-way barrel, and the mechanic is loaded AS
// PART OF that barrel building its own def, so going through `registry.ts`
// there would reopen the cycle this store exists to avoid.
import type { InnerWayDef } from "./define"

let defs: readonly InnerWayDef[] = []

export function setInnerWayDefs(next: readonly InnerWayDef[]): void {
  defs = next
}

export function innerWayDefs(): readonly InnerWayDef[] {
  return defs
}
