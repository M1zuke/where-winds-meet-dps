import type { ConsumableDef } from "../../definitions/consumables/consumableDef"
import { fireOil } from "./fireOil"
import { toxicPowder } from "./toxicPowder"

export const CONSUMABLE_DEFS: readonly ConsumableDef[] = [fireOil, toxicPowder]
