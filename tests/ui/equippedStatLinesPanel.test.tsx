import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { EMPTY_EQUIPPED } from "../../src/engine/types"
import type { GearPiece, GearSlot, GearWordId, Inputs } from "../../src/engine/types"
import type { CustomGraduationBuild } from "../../src/engine/customGraduationBuild"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { EquippedStatLinesPanel } from "../../src/ui/features/overview/equipped-stat-lines-panel/EquippedStatLinesPanel"
import { equippedStatLineCounts } from "../../src/ui/features/overview/equipped-stat-lines-panel/equippedStatLineCounts"

const UNKNOWN_CLASS_ID = "classWithoutBuiltinBuilds"

function pieceWithWords(slot: GearSlot, words: readonly string[]): GearPiece {
  const entries = Array.from({ length: 5 }, (_, index) => ({
    word: words[index] ?? "",
    value: 1,
    retuned: false,
  }))
  return {
    id: `piece-${slot}`,
    slot,
    level: 96,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: entries as GearPiece["words"],
    attunement: "",
    attunementValue: 0,
    relayed: false,
  }
}

function customBuild(
  slots: readonly { slot: GearSlot; words: readonly GearWordId[] }[],
): CustomGraduationBuild {
  return {
    id: "custom-build",
    name: "Custom build",
    classId: UNKNOWN_CLASS_ID,
    slots: slots.map((entry) => ({
      slot: entry.slot,
      words: entry.words as CustomGraduationBuild["slots"][number]["words"],
      attunement: "",
    })),
    set: null,
    bowSet: null,
    arsenal: "general",
    rotationId: "none",
    createdAt: "",
    updatedAt: "",
  }
}

function inputsWith(pieces: readonly GearPiece[], build?: CustomGraduationBuild): Inputs {
  const equipped = { ...EMPTY_EQUIPPED }
  for (const piece of pieces) equipped[piece.slot] = piece.id
  return {
    ...defaultInputs,
    classId: UNKNOWN_CLASS_ID,
    inventory: [...pieces],
    equipped,
    graduationBuildId: build?.id ?? null,
    customGraduationBuild: build ?? null,
  }
}

describe("equippedStatLineCounts", () => {
  it("counts a word once per slot it fills, including twice on one piece", () => {
    const counts = equippedStatLineCounts(
      inputsWith([
        pieceWithWords("leftWeapon", ["crit", "crit", "precision"]),
        pieceWithWords("helm", ["crit"]),
      ]),
    )
    expect(counts.rows).toEqual([
      { statLineId: "crit", current: 3, wanted: 0 },
      { statLineId: "precision", current: 1, wanted: 0 },
    ])
    expect(counts.currentTotal).toBe(4)
  })

  it("skips empty and unknown words", () => {
    const counts = equippedStatLineCounts(
      inputsWith([pieceWithWords("leftWeapon", ["", "notAStatLine", "crit"])]),
    )
    expect(counts.rows.map((row) => row.statLineId)).toEqual(["crit"])
    expect(counts.currentTotal).toBe(1)
  })

  it("counts only equipped pieces", () => {
    const spare = pieceWithWords("helm", ["crit"])
    const inputs = inputsWith([pieceWithWords("leftWeapon", ["precision"])])
    expect(
      equippedStatLineCounts({ ...inputs, inventory: [...inputs.inventory, spare] }).rows,
    ).toEqual([{ statLineId: "precision", current: 1, wanted: 0 }])
  })

  it("gives a line outside the followed build a wanted count of zero", () => {
    const build = customBuild([
      { slot: "leftWeapon", words: ["crit", "crit", "crit", "crit", "crit"] },
    ])
    const counts = equippedStatLineCounts(
      inputsWith([pieceWithWords("leftWeapon", ["precision"])], build),
    )
    expect(counts.rows.find((row) => row.statLineId === "precision")).toEqual({
      statLineId: "precision",
      current: 1,
      wanted: 0,
    })
  })

  it("lists a line only the build wants with a current count of zero", () => {
    const build = customBuild([
      { slot: "leftWeapon", words: ["affinity", "affinity", "crit", "crit", "crit"] },
    ])
    const counts = equippedStatLineCounts(inputsWith([], build))
    expect(counts.rows).toEqual([
      { statLineId: "crit", current: 0, wanted: 3 },
      { statLineId: "affinity", current: 0, wanted: 2 },
    ])
    expect(counts.currentTotal).toBe(0)
    expect(counts.wantedTotal).toBe(5)
  })

  it("sorts by current, then wanted, then position in the stat line list", () => {
    const build = customBuild([
      { slot: "leftWeapon", words: ["affinity", "affinity", "crit", "precision", "precision"] },
    ])
    const counts = equippedStatLineCounts(
      inputsWith(
        [pieceWithWords("leftWeapon", ["affinity", "crit", "precision", "crit", "precision"])],
        build,
      ),
    )
    expect(counts.rows.map((row) => [row.statLineId, row.current, row.wanted])).toEqual([
      ["precision", 2, 2],
      ["crit", 2, 1],
      ["affinity", 1, 2],
    ])
  })

  it("breaks a full tie by position in the stat line list", () => {
    const counts = equippedStatLineCounts(
      inputsWith([pieceWithWords("leftWeapon", ["affinity", "crit", "precision"])]),
    )
    expect(counts.rows.map((row) => row.statLineId)).toEqual(["precision", "crit", "affinity"])
  })

  it("reports no wanted total and lists only equipped lines without a followed build", () => {
    const counts = equippedStatLineCounts(inputsWith([pieceWithWords("leftWeapon", ["crit"])]))
    expect(counts.wantedTotal).toBeNull()
    expect(counts.rows).toEqual([{ statLineId: "crit", current: 1, wanted: 0 }])
  })
})

describe("EquippedStatLinesPanel", () => {
  function renderPanel(inputs: Inputs) {
    return render(
      <I18nProvider>
        <EquippedStatLinesPanel inputs={inputs} />
      </I18nProvider>,
    )
  }

  it("shows current over wanted per line when a build is followed", () => {
    const build = customBuild([
      { slot: "leftWeapon", words: ["crit", "crit", "affinity", "affinity", "affinity"] },
    ])
    renderPanel(inputsWith([pieceWithWords("leftWeapon", ["crit"])], build))
    const critRow = screen.getByText("Critical Rate").closest("tr") as HTMLElement
    expect(critRow.textContent).toContain("1 / 2")
    const affinityRow = screen.getByText("Affinity Rate").closest("tr") as HTMLElement
    expect(affinityRow.textContent).toContain("0 / 3")
  })

  it("shows only the current count without a followed build", () => {
    renderPanel(inputsWith([pieceWithWords("leftWeapon", ["crit", "crit"])]))
    const critRow = screen.getByText("Critical Rate").closest("tr") as HTMLElement
    expect(critRow.textContent).toBe("Critical Rate2")
  })

  it("shows the empty hint when nothing is equipped and nothing is followed", () => {
    renderPanel(inputsWith([]))
    expect(screen.getByText("No stat lines on the equipped gear.")).toBeTruthy()
  })
})
