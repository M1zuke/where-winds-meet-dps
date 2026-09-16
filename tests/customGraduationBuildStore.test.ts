import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  customGraduationBuildFor,
  deleteCustomGraduationBuild,
  exportCustomGraduationBuild,
  importCustomGraduationBuild,
  loadCustomGraduationBuilds,
  saveCustomGraduationBuild,
} from "../src/storage"
import { newCustomGraduationBuildId } from "../src/engine/customGraduationBuild"
import type { CustomGraduationBuild } from "../src/engine/customGraduationBuild"
import { classDefinition } from "../src/definitions/classes/registry"
import { GEAR_SLOTS } from "../src/engine/types"

const CLASS = "bellstrikeUmbra"
const OTHER_CLASS = "stonesplitStrength"

function buildFrom(classId: string, name: string): CustomGraduationBuild {
  const shipped = classDefinition(classId)!.graduationBuilds[0]
  const now = new Date().toISOString()
  return {
    id: newCustomGraduationBuildId(),
    name,
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

describe("the custom graduation build store", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("reads back what it saved", () => {
    const saved = saveCustomGraduationBuild(buildFrom(CLASS, "Mine"))
    expect(customGraduationBuildFor(CLASS)).toMatchObject({ id: saved.id, name: "Mine" })
  })

  it("keeps one build per class — saving again replaces it", () => {
    saveCustomGraduationBuild(buildFrom(CLASS, "First"))
    saveCustomGraduationBuild(buildFrom(CLASS, "Second"))
    expect(loadCustomGraduationBuilds()).toHaveLength(1)
    expect(customGraduationBuildFor(CLASS)?.name).toBe("Second")
  })

  it("keeps the builds of other classes when one class saves", () => {
    saveCustomGraduationBuild(buildFrom(CLASS, "Mine"))
    saveCustomGraduationBuild(buildFrom(OTHER_CLASS, "Theirs"))
    expect(customGraduationBuildFor(CLASS)?.name).toBe("Mine")
    expect(customGraduationBuildFor(OTHER_CLASS)?.name).toBe("Theirs")
  })

  it("deletes only the named class", () => {
    saveCustomGraduationBuild(buildFrom(CLASS, "Mine"))
    saveCustomGraduationBuild(buildFrom(OTHER_CLASS, "Theirs"))
    deleteCustomGraduationBuild(CLASS)
    expect(customGraduationBuildFor(CLASS)).toBeNull()
    expect(customGraduationBuildFor(OTHER_CLASS)?.name).toBe("Theirs")
  })

  it("mints a fresh id on import and never trusts the file's class", () => {
    const mine = saveCustomGraduationBuild(buildFrom(CLASS, "Mine"))
    const imported = importCustomGraduationBuild(exportCustomGraduationBuild(mine), OTHER_CLASS)
    expect(imported.id).not.toBe(mine.id)
    expect(imported.classId).toBe(OTHER_CLASS)
    expect(imported.slots).toEqual(mine.slots)
  })

  it("refuses a payload that is not a build", () => {
    expect(() => importCustomGraduationBuild("[]", CLASS)).toThrow()
    expect(() => importCustomGraduationBuild(JSON.stringify({ name: "x" }), CLASS)).toThrow()
  })

  it("drops a stored blob written under another version", () => {
    saveCustomGraduationBuild(buildFrom(CLASS, "Mine"))
    const raw = JSON.parse(localStorage.getItem("wwm.customGraduationBuilds")!)
    localStorage.setItem("wwm.customGraduationBuilds", JSON.stringify({ ...raw, v: raw.v + 1 }))
    expect(loadCustomGraduationBuilds()).toEqual([])
  })

  it("drops a stored build whose stat lines this build cannot resolve", () => {
    const mine = buildFrom(CLASS, "Mine")
    const broken = {
      ...mine,
      slots: mine.slots.map((slot, index) =>
        index === 0 ? { ...slot, words: ["nope", ...slot.words.slice(1)] } : slot,
      ),
    }
    localStorage.setItem("wwm.customGraduationBuilds", JSON.stringify({ v: 1, builds: [broken] }))
    expect(loadCustomGraduationBuilds()).toEqual([])
  })
})
