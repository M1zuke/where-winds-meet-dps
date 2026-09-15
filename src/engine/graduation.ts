import {
  DEFAULT_ENHANCEMENTS,
  DEFAULT_ODDITIES,
  getDefaultTalentsForClass,
} from "../definitions/baseStats"
import { classDefinition } from "../definitions/classes/registry"
import { gearLevelForBreakthrough } from "../definitions/baseStats/breakthroughs"
import type { GraduationBuild } from "../definitions/classes/classDef"
import { gearPieceAtGearLevel, relayGraduationGearPiece } from "../data/classes/graduationGear"
import type { EquippedSlots, GearLevel, Inputs, OddityRegions } from "./types"
import { EMPTY_EQUIPPED } from "./types"

export type GraduationVariant = "maxRolls" | "relayed"

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

function onBuiltinRotation(inputs: Inputs, rotationId: string): Inputs {
  return { ...inputs, activeCustomRotation: null, selectedBuiltinRotationId: rotationId }
}

export function withGraduationRotation(inputs: Inputs): Inputs | null {
  const build = classDefinition(inputs.classId)?.graduationBuild
  return build ? onBuiltinRotation(inputs, build.rotationId) : null
}

export function graduationBuild(
  classId: string,
  variant: GraduationVariant,
  level: GearLevel,
): GraduationBuild | null {
  const build = classDefinition(classId)?.graduationBuild
  if (!build) return null
  const leveledGear = build.gear.map((piece) => gearPieceAtGearLevel(piece, level))
  if (variant === "maxRolls") return { ...build, gear: leveledGear }
  const overrides = build.relayedOverrides ?? {}
  const baseGear = overrides.gear
    ? overrides.gear.map((piece) => gearPieceAtGearLevel(piece, level))
    : leveledGear
  return {
    ...build,
    ...overrides,
    gear: baseGear.map((piece) => relayGraduationGearPiece(piece, level)),
  }
}

export function graduationInputs(
  inputs: Inputs,
  variant: GraduationVariant = "maxRolls",
): Inputs | null {
  const level = gearLevelForBreakthrough(inputs.breakthrough)
  const build = graduationBuild(inputs.classId, variant, level)
  if (!build) return null
  const inventory = build.gear.map((piece) => ({
    ...piece,
    words: piece.words.map((word) => ({ ...word })) as typeof piece.words,
  }))
  return {
    ...onBuiltinRotation(inputs, build.rotationId),
    allDamageBoost: 0,
    independentDamageBoost: 0,
    inventory,
    equipped: equippedSlots(build),
    set: build.set,
    bowSet: build.bowSet,
    arsenal: build.arsenal,
    martialArtsTalents: getDefaultTalentsForClass(inputs.classId, inputs.breakthrough).map(
      (talent) => ({
        ...talent,
        enabled: true,
      }),
    ),
    oddities: allOddities(),
    enhancements: { ...DEFAULT_ENHANCEMENTS },
  }
}
