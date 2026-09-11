import type { ConsumableDef } from "./consumableDef"
import { CONSUMABLE_DEFS } from "../../data/consumables"
import { registerMechanic } from "../../engine/mechanics"

export { CONSUMABLE_DEFS }

for (const consumable of CONSUMABLE_DEFS) {
  for (const { mechanic } of consumable.mechanics ?? []) registerMechanic(mechanic)
}

export const CONSUMABLE_BY_ID: Readonly<Record<string, ConsumableDef>> = Object.fromEntries(
  CONSUMABLE_DEFS.map((consumable) => [consumable.id, consumable]),
)
