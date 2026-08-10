import type { BuffModule } from "../../../engine/buffs/buffModule"

// Does no runtime work — it exists so TypeScript checks each buff literal at
// its definition site instead of at a distant barrel, and the `const` type
// parameter keeps literal id types narrow.
export function defineBuff<const T extends BuffModule>(module: T): T {
  return module
}
