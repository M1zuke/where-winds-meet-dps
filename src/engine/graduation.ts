import { DEFAULT_ODDITIES, getDefaultTalentsForClass } from "../definitions/baseStats"
import { classDefinition } from "../definitions/classes/registry"
import type { GraduationBuild } from "../definitions/classes/classDef"
import type { EquippedSlots, Inputs, OddityRegions } from "./types"
import { EMPTY_EQUIPPED } from "./types"

function allOddities(): OddityRegions {
  return Object.fromEntries(
    Object.entries(DEFAULT_ODDITIES).map(([region, nodes]) => [
      region,
      nodes.map((node) => ({ ...node, enabled: true })),
    ]),
  )
}

function equippedSlots(build: GraduationBuild): EquippedSlots {
  const equipped = { ...EMPTY_EQUIPPED }
  for (const piece of build.gear) equipped[piece.slot] = piece.id
  return equipped
}

export function graduationInputs(inputs: Inputs): Inputs | null {
  const build = classDefinition(inputs.classId)?.graduationBuild
  if (!build) return null
  const inventory = build.gear.map((piece) => ({
    ...piece,
    words: piece.words.map((word) => ({ ...word })) as typeof piece.words,
  }))
  return {
    ...inputs,
    allDamageBoost: 0,
    inventory,
    equipped: equippedSlots(build),
    set: build.set,
    bowSet: build.bowSet,
    arsenal: build.arsenal,
    martialArtsTalents: getDefaultTalentsForClass(inputs.classId).map((talent) => ({
      ...talent,
      enabled: true,
    })),
    oddities: allOddities(),
  }
}
