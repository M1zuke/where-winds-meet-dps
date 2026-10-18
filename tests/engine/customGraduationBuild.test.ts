import { describe, expect, it } from "vitest"
import { gearWordMaxRoll } from "../../src/data/stats/statLines"
import { classDefinition } from "../../src/definitions/classes/registry"
import {
  graduationBuildFromCustom,
  isCustomGraduationBuild,
  newCustomGraduationBuildId,
} from "../../src/engine/customGraduationBuild"
import type { CustomGraduationBuild } from "../../src/engine/customGraduationBuild"
import { defaultInputs } from "../../src/engine/defaults"
import { computeGraduation } from "../../src/engine/dpsWorker"
import { followedGraduationBuild, graduationBuildsForProfile } from "../../src/engine/graduation"
import type { Inputs } from "../../src/engine/types"
import { defaultCombatSettings, GEAR_SLOTS } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const OTHER_CLASS = "stonesplitStrength"

function customFrom(classId: string, buildIndex = 0): CustomGraduationBuild {
  const shipped = classDefinition(classId)!.graduationBuilds[buildIndex]
  const now = new Date().toISOString()
  return {
    id: newCustomGraduationBuildId(),
    name: "Mine",
    classId,
    slots: GEAR_SLOTS.map((slot) => {
      const piece = shipped.gear.find((gear) => gear.slot === slot)!
      return {
        slot,
        words: piece.words.map(
          (word) => word.word,
        ) as unknown as CustomGraduationBuild["slots"][number]["words"],
        attunement: piece.attunement,
      }
    }),
    set: shipped.set,
    bowSet: shipped.bowSet,
    arsenal: shipped.arsenal,
    rotationId: shipped.rotationId,
    createdAt: now,
    updatedAt: now,
  }
}

describe("a build the user authored", () => {
  it("stands beside the shipped builds of its own class", () => {
    const custom = customFrom(CLASS)
    const offered = graduationBuildsForProfile({ classId: CLASS, customGraduationBuild: custom })
    expect(offered).toHaveLength(classDefinition(CLASS)!.graduationBuilds.length + 1)
    expect(offered.map((build) => build.id)).toContain(custom.id)
  })

  it("is ignored by a profile that plays another class", () => {
    const custom = customFrom(CLASS)
    const offered = graduationBuildsForProfile({
      classId: OTHER_CLASS,
      customGraduationBuild: custom,
    })
    expect(offered.map((build) => build.id)).not.toContain(custom.id)
  })

  it("is followed once the profile names it", () => {
    const custom = customFrom(CLASS)
    const followed = followedGraduationBuild({
      classId: CLASS,
      graduationBuildId: custom.id,
      customGraduationBuild: custom,
    })
    expect(followed?.id).toBe(custom.id)
  })

  it("rolls every line at its maximum, on the level the shipped benchmark sits at", () => {
    const level = classDefinition(CLASS)!.graduationBuilds[0].gear[0].level
    const derived = graduationBuildFromCustom(customFrom(CLASS))
    for (const piece of derived.gear) {
      expect(piece.level).toBe(level)
      for (const entry of piece.words) {
        expect(entry.value).toBe(gearWordMaxRoll(entry.word as never, level))
      }
    }
  })

  it("carries the set, bow set, arsenal and rotation it was given", () => {
    const custom = customFrom(CLASS)
    const derived = graduationBuildFromCustom(custom)
    expect(derived).toMatchObject({
      set: custom.set,
      bowSet: custom.bowSet,
      arsenal: custom.arsenal,
      rotationId: custom.rotationId,
    })
  })

  it("is refused when a stat line or an attunement is one this build cannot resolve", () => {
    const custom = customFrom(CLASS)
    const badWord = {
      ...custom,
      slots: custom.slots.map((slot, index) =>
        index === 0
          ? { ...slot, words: ["nope", ...slot.words.slice(1)] as unknown as typeof slot.words }
          : slot,
      ),
    }
    const badAttunement = {
      ...custom,
      slots: custom.slots.map((slot, index) =>
        index === 0 ? { ...slot, attunement: "nope" } : slot,
      ),
    }
    expect(isCustomGraduationBuild(badWord)).toBe(false)
    expect(isCustomGraduationBuild(badAttunement)).toBe(false)
    expect(isCustomGraduationBuild(custom)).toBe(true)
  })
})

describe("a build the user authored, rated for graduation", { timeout: 30_000 }, () => {
  const COPIED_BUILDS = ["bellstrikeUmbra", "bamboocutDraught"].flatMap((classId) =>
    classDefinition(classId)!.graduationBuilds.map((build) => [build.id, classId, build] as const),
  )

  it.each(COPIED_BUILDS)(
    "a copy of %s rates and benchmarks exactly as the build it was copied from",
    (shippedId, classId, shipped) => {
      const copy = customFrom(classId, classDefinition(classId)!.graduationBuilds.indexOf(shipped))
      const following = (graduationBuildId: string): Inputs => ({
        ...defaultInputs,
        classId,
        customGraduationBuild: copy,
        graduationBuildId,
      })

      expect(computeGraduation({ reqId: 22, inputs: following(copy.id) })).toEqual(
        computeGraduation({ reqId: 22, inputs: following(shippedId) }),
      )
    },
  )

  it("rates the same however the profile's own encounter and inner ways are set", () => {
    const copy = customFrom(CLASS)
    const plain: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customGraduationBuild: copy,
      graduationBuildId: copy.id,
    }
    const tinkered: Inputs = {
      ...plain,
      dummyMode: true,
      food: false,
      divinecraft: "poison",
      shareDebuff5HenZhi: true,
      shareEasyHurt: true,
      combatSettings: {
        ...defaultCombatSettings(),
        script: "wraithstrikeScript",
        dragonsBreath: true,
        healerBuff: true,
        breakExtension: true,
      },
      mindMethods: [
        { id: "bitterSeason", name: "Bitter Season", stacks: "tier 5" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
    }

    expect(computeGraduation({ reqId: 23, inputs: tinkered })).toEqual(
      computeGraduation({ reqId: 23, inputs: plain }),
    )
  })

  it("takes the encounter of the shipped build on its own rotation", () => {
    const shippedBuilds = classDefinition(CLASS)!.graduationBuilds
    const shipped = shippedBuilds.find((build) => build.id.endsWith("st-burst"))!
    const copy = customFrom(CLASS, shippedBuilds.indexOf(shipped))
    const offered = graduationBuildsForProfile({ classId: CLASS, customGraduationBuild: copy })

    expect(shipped.standardized).toBeDefined()
    expect(offered[offered.length - 1].standardized).toEqual(shipped.standardized)
  })

  it("falls back to the class's first standard on a rotation no shipped build runs", () => {
    const shippedBuilds = classDefinition(CLASS)!.graduationBuilds
    const usedRotations = shippedBuilds.map((build) => build.rotationId)
    const unusedRotation = classDefinition(CLASS)!.rotations.find(
      (rotation) => !usedRotations.includes(rotation.id),
    )!
    const copy = { ...customFrom(CLASS), rotationId: unusedRotation.id }
    const offered = graduationBuildsForProfile({ classId: CLASS, customGraduationBuild: copy })

    expect(offered[offered.length - 1].standardized).toBe(
      shippedBuilds.find((build) => build.standardized)!.standardized,
    )
  })
})
