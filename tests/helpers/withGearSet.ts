import { defaultInputs } from "../../src/engine/defaults"
import { gearLevelForBreakthrough } from "../../src/definitions/baseStats/breakthroughs"
import type {
  BowGearLevel,
  BowPiece,
  BowSet,
  GearPiece,
  GearSlot,
  Inputs,
} from "../../src/engine/types"
import { WEAPON_SLOTS, emptyGearWords } from "../../src/engine/types"

function zeroPiece(slot: GearSlot, inputs: Inputs): GearPiece {
  return {
    id: `zero-${slot}`,
    slot,
    level: gearLevelForBreakthrough(inputs.breakthrough),
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: emptyGearWords(),
    attunement: "",
    attunementValue: 0,
    relayed: false,
  }
}

function withoutSet(piece: GearPiece): GearPiece {
  const { set: _removed, ...rest } = piece
  void _removed
  return rest
}

export interface GearSetOptions {
  fabricatePieces?: boolean
}

function hasEquippedSetBearingPiece(inputs: Inputs): boolean {
  return WEAPON_SLOTS.some((slot) =>
    inputs.inventory.some((piece) => piece.id === inputs.equipped[slot]),
  )
}

export function withGearSet(
  inputs: Inputs,
  setId: string | null,
  options: GearSetOptions = {},
): Inputs {
  let base = inputs
  if (!hasEquippedSetBearingPiece(inputs)) {
    if (!options.fabricatePieces) {
      throw new Error("withGearSet needs equipped set-bearing pieces or fabricatePieces: true")
    }
    base = {
      ...inputs,
      inventory: [...inputs.inventory, ...WEAPON_SLOTS.map((slot) => zeroPiece(slot, inputs))],
      equipped: {
        ...inputs.equipped,
        ...Object.fromEntries(WEAPON_SLOTS.map((slot) => [slot, `zero-${slot}`])),
      },
    }
  }
  const carriers = new Set(WEAPON_SLOTS.map((slot) => base.equipped[slot]).filter(Boolean))
  return {
    ...base,
    inventory: base.inventory.map((piece) => {
      if (!carriers.has(piece.id)) return piece
      return setId === null ? withoutSet(piece) : { ...piece, set: setId }
    }),
  }
}

export function gearSetFields(
  setId: string | null,
  options: GearSetOptions = {},
  base: Inputs = defaultInputs,
): Pick<Inputs, "inventory" | "equipped"> {
  const { inventory, equipped } = withGearSet(base, setId, options)
  return { inventory, equipped }
}

export function withBowSet(inputs: Inputs, set: BowSet, level: BowGearLevel): Inputs {
  const piece: BowPiece | null = set === null ? null : { level, rarity: "legendary", set }
  return { ...inputs, bowGear: { bow: piece && { ...piece }, thumbRing: piece && { ...piece } } }
}
