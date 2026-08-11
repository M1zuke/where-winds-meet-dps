// A cycle-free leaf: this file imports nothing but a type (erased at
// runtime), so both `index.ts` (the writer) and `registry.ts` (the reader) —
// which do cycle through each other via the engine's self-registering
// mechanics, see `registry.ts`'s own comment — always finish evaluating this
// module before either can reenter the cycle. `classDefs()` before
// `index.ts`'s registration loop completes is an honest `[]`, never a `var`
// masquerading as always-defined.
import type { ClassDef } from "./define"

let defs: readonly ClassDef[] = []

export function setClassDefs(next: readonly ClassDef[]): void {
  defs = next
}

export function classDefs(): readonly ClassDef[] {
  return defs
}
