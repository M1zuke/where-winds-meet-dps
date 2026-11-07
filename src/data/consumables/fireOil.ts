import { defineConsumable } from "../../definitions/consumables/consumableDef"
import { declareMechanic } from "../../engine/mechanics"
import { fireOilBurnMechanic } from "./divinecraftMechanics"

export const fireOil = defineConsumable({
  id: "fireOil",
  name: "Fire Oil",
  mechanics: [declareMechanic(fireOilBurnMechanic())],
})
