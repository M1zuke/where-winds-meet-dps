import type { BuffModule } from "../../engine/buffs/buffModule"

// An identity wrapper: the module it returns is engine data like any other,
// consumed by `BuffEngine` and the timeline through whichever list declares
// it — `GLOBAL_BUFF_DEFS`, `GROUP_BUFF_DEFS`, or an inner way's `buffDefs`.
// The wrapper exists so TypeScript checks each buff literal at its definition
// site instead of at a distant barrel, and the `const` type parameter keeps
// literal id types narrow.
export function defineBuff<const T extends BuffModule>(module: T): T {
  return module
}

// A class's own buff — a weapon-art talent on its `classBuffDefs`, the only
// list that may carry the result. A buff an inner way owns is a plain
// `defineBuff` module on that inner way's `buffDefs`. `classBuff` is inert at
// runtime — `BuffEngine`, `applyEffect`, `catalog.ts` and `scope.ts` never
// read it; the list that declares a module is the only statement of its
// scope. See docs/CLASSES.md § "Buff ownership".
export function defineClassBuff<const T extends BuffModule>(
  buff: T,
): T & { readonly classBuff: true } {
  return { ...buff, classBuff: true }
}
