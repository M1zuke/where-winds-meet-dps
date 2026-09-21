import { DEFAULT_ENHANCEMENTS, getDefaultTalentsForClass } from "../definitions/baseStats"
import { gearLevelForBreakthrough } from "../definitions/baseStats/breakthroughs"
import type {
  GraduationBuild,
  StandardizedGraduation,
} from "../definitions/graduationBuilds/graduationBuildDef"
import { STANDARDIZED_ENCOUNTER_OFF } from "../definitions/graduationBuilds/graduationBuildDef"
import { allGraduationBuilds, graduationBuildsFor } from "../definitions/graduationBuilds/registry"
import { innerWayName } from "../definitions/innerWays/registry"
import { gearPieceAtGearLevel, relayGraduationGearPiece } from "../data/classes/graduationGear"
import { graduationBuildFromCustom } from "./customGraduationBuild"
import type { EquippedSlots, GearLevel, Inputs, MindMethodSlot } from "./types"
import { EMPTY_EQUIPPED } from "./types"

export type GraduationVariant = "maxRolls" | "relayed"

const MIND_METHOD_SLOT_COUNT = 4

function equippedSlots(build: GraduationBuild): EquippedSlots {
  const equipped = { ...EMPTY_EQUIPPED }
  for (const piece of build.gear) equipped[piece.slot] = piece.id
  return equipped
}

function onBuiltinRotation(inputs: Inputs, rotationId: string): Inputs {
  return { ...inputs, activeCustomRotation: null, selectedBuiltinRotationId: rotationId }
}

function standardizedMindMethods(standardized: StandardizedGraduation): Inputs["mindMethods"] {
  const slots: MindMethodSlot[] = standardized.innerWays
    .slice(0, MIND_METHOD_SLOT_COUNT)
    .map(({ id, tier }) => ({ id, name: innerWayName(id), stacks: `tier ${tier}` }))
  while (slots.length < MIND_METHOD_SLOT_COUNT) slots.push({ name: "", stacks: "" })
  return slots as Inputs["mindMethods"]
}

export function standardizedGraduationInputs(inputs: Inputs, build: GraduationBuild): Inputs {
  const standardized = build.standardized
  if (!standardized) return inputs
  const { dummyMode, food, divinecraft, shareDebuff5HenZhi, shareEasyHurt, ...combat } = {
    ...STANDARDIZED_ENCOUNTER_OFF,
    ...standardized.encounter,
  }
  return {
    ...inputs,
    dummyMode,
    food,
    divinecraft,
    shareDebuff5HenZhi,
    shareEasyHurt,
    combatSettings: { ...combat, qiBreakOverride: null },
    mindMethods: standardizedMindMethods(standardized),
  }
}

export function followedGraduationBuildAmong(
  builds: readonly GraduationBuild[],
  buildId: string | null | undefined,
): GraduationBuild | null {
  return builds.find((build) => build.id === buildId) ?? (builds.length === 1 ? builds[0] : null)
}

export function graduationBuildsForProfile(
  inputs: Pick<Inputs, "classId" | "customGraduationBuild">,
): readonly GraduationBuild[] {
  const builtin = graduationBuildsFor(inputs.classId)
  const custom = inputs.customGraduationBuild
  if (!custom || custom.classId !== inputs.classId) return builtin
  return [...builtin, graduationBuildFromCustom(custom)]
}

export function followedGraduationBuild(
  inputs: Pick<Inputs, "classId" | "graduationBuildId" | "customGraduationBuild">,
): GraduationBuild | null {
  return followedGraduationBuildAmong(graduationBuildsForProfile(inputs), inputs.graduationBuildId)
}

export function soleGraduationBuildId(classId: string): string | null {
  const builds = graduationBuildsFor(classId)
  return builds.length === 1 ? builds[0].id : null
}

export function repairGraduationBuildId(classId: string, stored: unknown): string | null {
  if (typeof stored !== "string" || stored === "") return soleGraduationBuildId(classId)
  const known = allGraduationBuilds().find((build) => build.id === stored)
  return known && known.classId !== classId ? soleGraduationBuildId(classId) : stored
}

export function graduationRatedInputs(inputs: Inputs): Inputs | null {
  const build = followedGraduationBuild(inputs)
  return build
    ? standardizedGraduationInputs(onBuiltinRotation(inputs, build.rotationId), build)
    : null
}

export function graduationBuildAtLevel(
  build: GraduationBuild,
  variant: GraduationVariant,
  level: GearLevel,
): GraduationBuild {
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
  const followed = followedGraduationBuild(inputs)
  if (!followed) return null
  const build = graduationBuildAtLevel(
    followed,
    variant,
    gearLevelForBreakthrough(inputs.breakthrough),
  )
  const inventory = build.gear.map((piece) => ({
    ...piece,
    words: piece.words.map((word) => ({ ...word })) as typeof piece.words,
  }))
  return standardizedGraduationInputs(
    {
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
      unclaimedOddityNodes: {},
      enhancements: { ...DEFAULT_ENHANCEMENTS },
    },
    build,
  )
}
