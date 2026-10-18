import { defaultEnhancementLevels, getDefaultTalentsForClass } from "../definitions/baseStats"
import { gearLevelForBreakthrough } from "../definitions/baseStats/breakthroughs"
import type {
  GraduationBuild,
  StandardizedEncounter,
  StandardizedGraduation,
  StandardizedInnerWay,
} from "../definitions/graduationBuilds/graduationBuildDef"
import {
  BEST_AVAILABLE_FOOD,
  STANDARDIZED_ENCOUNTER_OFF,
} from "../definitions/graduationBuilds/graduationBuildDef"
import { bestRecipeAttackFoodAt } from "../data/consumables/foods"
import { allGraduationBuilds, graduationBuildsFor } from "../definitions/graduationBuilds/registry"
import { innerWayName } from "../definitions/innerWays/registry"
import { gearPieceAtGearLevel, relayGraduationGearPiece } from "../data/classes/graduationGear"
import { graduationBuildFromCustom } from "./customGraduationBuild"
import type {
  BowGearLevel,
  BowPiece,
  EquippedSlots,
  GearLevel,
  Inputs,
  MindMethodSlot,
} from "./types"
import { BOW_GEAR_LEVELS, EMPTY_EQUIPPED, WEAPON_SLOTS } from "./types"

export type GraduationVariant = "maxRolls" | "relayed"

const MIND_METHOD_SLOT_COUNT = 4

function equippedSlots(build: GraduationBuild): EquippedSlots {
  const equipped = { ...EMPTY_EQUIPPED }
  for (const piece of build.gear) equipped[piece.slot] = piece.id
  return equipped
}

function bowGearLevelFor(gearLevel: GearLevel): BowGearLevel | null {
  if (gearLevel < BOW_GEAR_LEVELS[0]) return null
  return BOW_GEAR_LEVELS.find((level) => level >= gearLevel) ?? null
}

function onBuiltinRotation(inputs: Inputs, rotationId: string): Inputs {
  return { ...inputs, activeCustomRotation: null, selectedBuiltinRotationId: rotationId }
}

export function standardizedMindMethods(
  innerWays: readonly StandardizedInnerWay[],
): Inputs["mindMethods"] {
  const slots: MindMethodSlot[] = innerWays
    .slice(0, MIND_METHOD_SLOT_COUNT)
    .map(({ id, tier }) => ({ id, name: innerWayName(id), stacks: `tier ${tier}` }))
  while (slots.length < MIND_METHOD_SLOT_COUNT) slots.push({ name: "", stacks: "" })
  return slots as Inputs["mindMethods"]
}

// The inner ways a class's own graduation standard runs with, for defaulting
// a profile that has none of its own yet (`classSetup.ts`) — every build the
// class registers names the same list, so the first one that carries it is
// the class's list. `null` for a class with no standardized list at all.
export function standardizedInnerWaysForClass(
  classId: string,
): readonly StandardizedInnerWay[] | null {
  for (const build of graduationBuildsFor(classId)) {
    if (build.standardized?.innerWays.length) return build.standardized.innerWays
  }
  return null
}

export function resolveStandardizedFood(
  food: StandardizedEncounter["food"],
  breakthrough: number,
): Inputs["food"] {
  return food === BEST_AVAILABLE_FOOD ? bestRecipeAttackFoodAt(breakthrough) : food
}

export function standardizedGraduationInputs(inputs: Inputs, build: GraduationBuild): Inputs {
  const standardized = build.standardized
  if (!standardized) return inputs
  const {
    dummyMode,
    food,
    hpFood,
    divinecraft,
    divinecraftRefinement,
    shareDebuff5HenZhi,
    shareEasyHurt,
    ...combat
  } = {
    ...STANDARDIZED_ENCOUNTER_OFF,
    ...standardized.encounter,
  }
  return {
    ...inputs,
    dummyMode,
    food: resolveStandardizedFood(food, inputs.breakthrough),
    hpFood,
    divinecraft,
    divinecraftRefinement,
    shareDebuff5HenZhi,
    shareEasyHurt,
    combatSettings: { ...combat },
    mindMethods: standardizedMindMethods(standardized.innerWays),
  }
}

export function followedGraduationBuildAmong(
  builds: readonly GraduationBuild[],
  buildId: string | null | undefined,
): GraduationBuild | null {
  return builds.find((build) => build.id === buildId) ?? (builds.length === 1 ? builds[0] : null)
}

function classStandardOnRotation(
  builtin: readonly GraduationBuild[],
  rotationId: string,
): StandardizedGraduation | undefined {
  const standardizedBuilds = builtin.filter((build) => build.standardized)
  return (
    standardizedBuilds.find((build) => build.rotationId === rotationId) ?? standardizedBuilds[0]
  )?.standardized
}

export function graduationBuildsForProfile(
  inputs: Pick<Inputs, "classId" | "customGraduationBuild">,
): readonly GraduationBuild[] {
  const builtin = graduationBuildsFor(inputs.classId)
  const custom = inputs.customGraduationBuild
  if (!custom || custom.classId !== inputs.classId) return builtin
  const authored = graduationBuildFromCustom(custom)
  const standardized = classStandardOnRotation(builtin, custom.rotationId)
  return [...builtin, standardized ? { ...authored, standardized } : authored]
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
  const gearLevel = gearLevelForBreakthrough(inputs.breakthrough)
  const build = graduationBuildAtLevel(followed, variant, gearLevel)
  const inventory = build.gear.map((piece) => ({
    ...piece,
    words: piece.words.map((word) => ({ ...word })) as typeof piece.words,
    ...(build.set && WEAPON_SLOTS.includes(piece.slot) ? { set: build.set } : {}),
  }))
  const bowLevel = bowGearLevelFor(gearLevel)
  const bowPiece: BowPiece | null =
    build.bowSet && bowLevel !== null
      ? { level: bowLevel, rarity: "legendary", set: build.bowSet }
      : null
  const equipped = equippedSlots(build)
  return standardizedGraduationInputs(
    {
      ...onBuiltinRotation(inputs, build.rotationId),
      allDamageBoost: 0,
      independentDamageBoost: 0,
      qiDamageBoost: 0,
      qiRateAdd: 0,
      qiDamageIndexMultiplier: 0,
      inventory,
      equipped,
      bowGear: { bow: bowPiece && { ...bowPiece }, thumbRing: bowPiece && { ...bowPiece } },
      arsenal: build.arsenal,
      martialArtsTalents: getDefaultTalentsForClass(inputs.classId, inputs.breakthrough).map(
        (talent) => ({
          ...talent,
          enabled: true,
        }),
      ),
      unclaimedOddityNodes: {},
      enhancements: defaultEnhancementLevels(inputs.breakthrough, { inventory, equipped }),
    },
    build,
  )
}
