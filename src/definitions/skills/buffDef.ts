import type { BuffModule } from "../../engine/buffs/buffModule"

// Does no runtime work — it exists so TypeScript checks each buff literal at
// its definition site instead of at a distant barrel, and the `const` type
// parameter keeps literal id types narrow.
export function defineBuff<const T extends BuffModule>(module: T): T {
  return module
}

// A class buff: reachable through one of two owners, never both — a class's
// own `classBuffDefs`, or the `buffDefs` of an inner way it can slot, folded
// into every slotting class's set. `classBuff` is inert at runtime —
// `BuffEngine`, `applyEffect`, `catalog.ts` and `scope.ts` never read it;
// whichever owner lists the result is the only statement of scope. See
// docs/CLASSES.md § "Buff category" for the reachability question this marks.
export function defineClassBuff<const T extends BuffModule>(
  buff: T,
): T & { readonly classBuff: true } {
  return { ...buff, classBuff: true }
}
