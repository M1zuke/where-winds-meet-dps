// Scoped to Bellstrike Umbra and Bellstrike Splendor — see CLASSES.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { ATTUNEMENT_OPTIONS, attunementsForClass } from "../../src/engine/attunements"
import { buildContext } from "../../src/engine/panel"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

const SPLENDOR = "bellstrikeSplendor"
const UMBRA = "bellstrikeUmbra"
const OFFICIAL_LABELS: Readonly<Record<string, string>> = {
  namelessSwordQ: "Nameless Sword Martial Art Skill DMG Boost",
  swordCharged: "Nameless Sword Charged Skill DMG Boost",
  namelessSwordSpecial: "Nameless Sword Special Skill DMG Boost",
  namelessSpearCharged: "Nameless Spear Charged Skill DMG Boost",
  spearSpecial: "Nameless Spear Special Skill DMG Boost",
  swordQ: "Strategic Sword Martial Art Skill DMG Boost",
  swordSpecial: "Strategic Sword Special Skill DMG Boost",
  spearQ: "Heavenquaker Spear Martial Art Skill DMG Boost",
  spearCharged: "Heavenquaker Spear Charged Skill DMG Boost",
}

function inputsFor(classId: string, classSpecificAttunement: Record<string, number>): Inputs {
  return { ...defaultInputs, classId, classSpecificAttunement }
}

describe("every weapon-art attunement option belongs to one class", () => {
  it("has exactly one class and its official label", () => {
    for (const [id, label] of Object.entries(OFFICIAL_LABELS)) {
      const option = ATTUNEMENT_OPTIONS.find((candidate) => candidate.id === id)!
      expect(option.classIds, id).toHaveLength(1)
      expect(option.label, id).toBe(label)
    }
  })

  it("keeps the two Bellstrike classes' option ids disjoint", () => {
    const splendor = attunementsForClass(SPLENDOR).map((option) => option.id)
    const umbra = attunementsForClass(UMBRA).map((option) => option.id)
    const shared = splendor.filter((id) => umbra.includes(id))
    expect(shared).toEqual([
      "physPen",
      "formlessPen",
      "bellstrikePen",
      "stonesplitPen",
      "silkbindPen",
      "bamboocutPen",
      "physResist",
    ])
  })
})

describe("a roll of the other class's line adds nothing", () => {
  it("scores an Umbra swordQ roll on no Splendor hit", () => {
    const context = buildContext(inputsFor(SPLENDOR, { swordQ: 0.05 }))
    expect(context.attuneBoostByTag).toEqual({})
  })

  it("scores a Splendor namelessSwordQ roll on no Umbra hit", () => {
    const context = buildContext(inputsFor(UMBRA, { namelessSwordQ: 0.05 }))
    expect(context.attuneBoostByTag).toEqual({})
  })

  it("scores a namelessSwordQ roll under its own tag on Splendor", () => {
    const context = buildContext(inputsFor(SPLENDOR, { namelessSwordQ: 0.05 }))
    expect(context.attuneBoostByTag).toEqual({ "attune:namelessSwordQ": 0.05 })
  })
})

describe("Splendor's skills carry its own attunement tags", () => {
  const tagged = (tag: string): string[] =>
    builtinSkillsForClass(SPLENDOR)
      .filter((skill) => (skill.tags ?? []).includes(tag))
      .map((skill) => skill.id.replace(`${SPLENDOR}-`, ""))

  it("puts the Splendor-own tags on the martial art, special and spear charged skills", () => {
    expect(tagged("attune:namelessSwordQ").sort()).toEqual(["swordq", "swordq-2nd", "swordq-3rd"])
    expect(tagged("attune:namelessSwordSpecial")).toEqual(["swordspecial"])
    expect(tagged("attune:namelessSpearCharged").sort()).toEqual([
      "stormdance-stage-1",
      "stormdance-stage-1-spin",
      "stormdance-stage-1-wushuang",
      "stormdance-stage-1-wushuang-spin",
    ])
  })

  it("keeps none of the three retired shared tags", () => {
    for (const tag of ["attune:swordQ", "attune:swordSpecial", "attune:spearCharged"]) {
      expect(tagged(tag), tag).toEqual([])
    }
  })
})
