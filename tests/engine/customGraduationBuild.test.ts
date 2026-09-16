import { describe, expect, it } from "vitest"
import { gearWordMaxRoll } from "../../src/data/stats/statLines"
import { classDefinition } from "../../src/definitions/classes/registry"
import {
  graduationBuildFromCustom,
  isCustomGraduationBuild,
  newCustomGraduationBuildId,
} from "../../src/engine/customGraduationBuild"
import type { CustomGraduationBuild } from "../../src/engine/customGraduationBuild"
import { followedGraduationBuild, graduationBuildsForProfile } from "../../src/engine/graduation"
import { GEAR_SLOTS } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const OTHER_CLASS = "stonesplitStrength"

function customFrom(classId: string): CustomGraduationBuild {
  const shipped = classDefinition(classId)!.graduationBuilds[0]
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
