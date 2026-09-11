import type { MechanicRegistration } from "../../engine/mechanics"

export interface ConsumableDef {
  id: string
  name: string
  mechanics?: readonly MechanicRegistration[]
}

// Thin on purpose, like `defineSet`/`defineSkill`/`defineBuff`: it exists so
// TypeScript checks each literal at its definition site, and the `const` type
// parameter keeps the literal `id` narrow.
export function defineConsumable<const T extends ConsumableDef>(consumable: T): T {
  return consumable
}
