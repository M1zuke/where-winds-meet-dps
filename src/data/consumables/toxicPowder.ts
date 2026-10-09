import { defineConsumable } from "../../definitions/consumables/consumableDef"
import { declareMechanic } from "../../engine/mechanics"
import { toxicPowderPoisonedMechanic } from "./divinecraftMechanics"

export const toxicPowder = defineConsumable({
  id: "toxicPowder",
  name: "Toxic Powder",
  mechanics: [declareMechanic(toxicPowderPoisonedMechanic())],
})
