import type {
  Inputs as CurrentInputs,
  StoredProfile as CurrentStoredProfile,
} from "../../src/engine/types"
import { WEAPON_SLOTS } from "../../src/engine/types"

export type Inputs = CurrentInputs & { set?: string | null; bowSet?: string | null }

export type StoredProfile = Omit<CurrentStoredProfile, "inputs"> & { inputs: Inputs }

export function carriedSets(inputs: CurrentInputs): (string | undefined)[] {
  return WEAPON_SLOTS.map((slot) => {
    const equippedId = inputs.equipped[slot]
    return inputs.inventory.find((piece) => piece.id === equippedId)?.set
  })
}
