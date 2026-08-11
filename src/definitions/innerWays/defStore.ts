// Its one consumer is `bitterSeasonMechanic.ts`, which needs the full
// inner-way def list but is loaded as part of the barrel that builds it, so
// it cannot read that list through `registry.ts` or the barrel itself without
// reopening the cycle this store exists to avoid.
import type { InnerWayDef } from "./innerWayDef"

let defs: readonly InnerWayDef[] = []

export function setInnerWayDefs(next: readonly InnerWayDef[]): void {
  defs = next
}

export function innerWayDefs(): readonly InnerWayDef[] {
  return defs
}
