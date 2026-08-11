// A cycle-free leaf: this file imports nothing but a type (erased at
// runtime). It exists to break a cycle between `index.ts` and `registry.ts`
// that no longer exists — see `registry.ts`'s own comment — but is kept as
// the safe, already-lazy path rather than folded away in this pass.
// `classDefs()` before `index.ts`'s registration loop completes is an honest
// `[]`, never a `var` masquerading as always-defined.
import type { ClassDef } from "./define"

let defs: readonly ClassDef[] = []

export function setClassDefs(next: readonly ClassDef[]): void {
  defs = next
}

export function classDefs(): readonly ClassDef[] {
  return defs
}
