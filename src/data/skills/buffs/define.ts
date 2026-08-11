import type { BuffModule } from "../../../engine/buffs/buffModule"

// Does no runtime work — it exists so TypeScript checks each buff literal at
// its definition site instead of at a distant barrel, and the `const` type
// parameter keeps literal id types narrow.
export function defineBuff<const T extends BuffModule>(module: T): T {
  return module
}

// A class buff: being the class is sufficient for it to be available, even
// when activation is still gated by an inner-way tier, a talent or a qi
// phase. `classBuff` is inert at runtime — `BuffEngine`, `applyEffect`,
// `catalog.ts` and `scope.ts` never read it; the class that lists the result
// in `classBuffDefs` / `mechanicBuffDefs` is the only statement of scope. See
// docs/CLASSES.md § "Buff category" for the reachability question this marks.
export function defineClassBuff<const T extends BuffModule>(buff: T): T & { readonly classBuff: true } {
  return { ...buff, classBuff: true }
}
