// The two class-specific weapon-boost rows are driven by the resolved
// active-or-default rotation's most-used weapons (`rotationWeapons` in
// `itemRanking.ts`), not `ClassDef.weapons`' static fallback list — the two
// can differ, so this asserts against what the rotation actually casts.
import { describe, expect, it } from "vitest"
import { computeRanking, getWordSpecs } from "../../src/engine/itemRanking"
import { computeGearContribution } from "../../src/engine/gearStats"
import { attunementsForClass, getAttunement } from "../../src/engine/attunements"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

describe("computeRanking — Bellstrike Umbra baseline rows", () => {
  const base = runEngine(umbraInputs)
  const rows = computeRanking(umbraInputs, base.dps)

  it("produces a row per gear word plus one per class-legal attunement", () => {
    expect(rows.filter((row) => row.source === "tunement").length).toBe(26)
    expect(rows.filter((row) => row.source === "attunement").map((row) => row.label)).toEqual([
      "Physical Resistance",
      "Strategic Sword - Bleeding DMG Boost",
      "Strategic Sword Martial Art Skill DMG Boost",
      "Strategic Sword Special Skill DMG Boost",
      "Heavenquaker Spear Martial Art Skill DMG Boost",
      "Heavenquaker Spear Charged Skill DMG Boost",
    ])
  })

  it("includes the default rotation's resolved weapons (Sword + Spear)", () => {
    expect(rows.some((r) => r.statLineId === "swordBoost")).toBe(true)
    expect(rows.some((r) => r.statLineId === "spearBoost")).toBe(true)
  })

  it("Precision (already at 100 %) caps at (none) — no positive lift", () => {
    const precision = rows.find((r) => r.statLineId === "precision")!
    expect(precision.leadVsMin).toBe("(none)")
  })

  it("rows include the highest-lift word with positive Lift", () => {
    const top = [...rows].sort((a, b) => b.liftPercent - a.liftPercent)[0]
    expect(top.liftPercent).toBeGreaterThan(0)
  })

  it("dpsDelta equals expectedDps minus the baseline for every row", () => {
    for (const row of rows) {
      expect(row.dpsDelta).toBeCloseTo(row.expectedDps - base.dps, 6)
    }
  })

  it("dpsDelta's sign agrees with liftPercent's sign", () => {
    const top = [...rows].sort((rowA, rowB) => rowB.liftPercent - rowA.liftPercent)[0]
    expect(top.liftPercent).toBeGreaterThan(0)
    expect(top.dpsDelta).toBeGreaterThan(0)

    const negativeLiftRow = rows.find((row) => row.liftPercent < 0)
    if (negativeLiftRow) {
      expect(negativeLiftRow.dpsDelta).toBeLessThan(0)
    }
  })
})

// Eleven rather than ten: the bleed attunement row lands third on this build,
// pushing Max Phys one place down without changing any word's own lift.
describe("computeRanking — top-rank consistency", () => {
  const base = runEngine(umbraInputs)
  const rows = computeRanking(umbraInputs, base.dps)
  const sorted = [...rows].sort((a, b) => b.liftPercent - a.liftPercent)
  const top11 = new Set(sorted.slice(0, 11).map((r) => r.statLineId))

  it("Physical Penetration ranks in the top 11", () =>
    expect(top11.has("physicalPenetration")).toBe(true))
  it("Max Phys ranks in the top 11", () => expect(top11.has("maxPhys")).toBe(true))
  it("Sword Martial Boost ranks in the top 11", () => expect(top11.has("swordBoost")).toBe(true))
  it("All Martial Boost ranks in the top 11", () => expect(top11.has("allMartialBoost")).toBe(true))
})

// `WordSpec.amount` and the `apply` delta must stay in lockstep, since
// `computeGearContribution` scales the delta by `value / amount`.
describe("Single-Target Mystic Skill DMG Boost — max roll", () => {
  const specs = getWordSpecs(umbraInputs)

  it("is pinned at 9.797 %, while the area mystic word stays at 7 %", () => {
    const single = specs.find((s) => s.word === "singleTargetMysticBoost")!
    expect(single.unit).toBe("percent")
    expect(single.amount).toBeCloseTo(0.09797, 10)

    const area = specs.find((s) => s.word === "areaMysticBoost")!
    expect(area.amount).toBeCloseTo(0.07, 10)
  })

  it("offers one merged area word, not the two pre-merge ones", () => {
    const areaWords = specs.filter((s) => s.label.startsWith("Area"))
    expect(areaWords.map((s) => s.word)).toEqual(["areaMysticBoost"])
  })

  it("a piece rolled at the new max contributes the full 9.797 % to singleMysticBoost", () => {
    const piece: GearPiece = {
      id: "test-single-mystic-max-piece",
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "singleTargetMysticBoost", value: 0.09797, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }

    const contribution = computeGearContribution(piece, umbraInputs)
    const entry = contribution.find((c) => c.path === "singleMysticBoost")
    expect(entry?.amount).toBeCloseTo(0.09797, 10)
  })
})

// The Gear tab offers a tunement word *and* an attunement per piece, so the lift
// table has to cover both catalogues. `Physical Penetration` / `Attribute
// Penetration` stay single rows on purpose — see
// `ATTUNEMENTS_ALREADY_LISTED_AS_WORDS`.
describe("attunement rows", () => {
  const base = runEngine(umbraInputs)
  const rows = computeRanking(umbraInputs, base.dps)
  const attunementRows = rows.filter((row) => row.source === "attunement")

  it("carries each option's in-game max roll as the amount", () => {
    for (const option of attunementsForClass("bellstrikeUmbra")) {
      const row = attunementRows.find((candidate) => candidate.label === option.label)
      if (!row) continue
      expect(row.unit).toBe("percent")
      expect(row.amount).toBeCloseTo(option.max, 10)
    }
  })

  it("the bleed attunement lifts DPS — the gear tag reaches Umbra's bleed rows", () => {
    const bleedLabel = getAttunement("bleedingDamage")!.label
    const bleed = attunementRows.find((row) => row.label === bleedLabel)!
    expect(bleed.liftPercent).toBeGreaterThan(0)
    expect(bleed.dpsDelta).toBeGreaterThan(0)
  })

  it("does not repeat the two penetration attunements already listed as words", () => {
    expect(attunementRows.some((row) => row.label === "Physical Penetration")).toBe(false)
    expect(attunementRows.some((row) => row.label === "Formless Penetration")).toBe(false)
    expect(rows.filter((row) => row.label === "Physical Penetration")).toHaveLength(1)
  })

  it("Physical Resistance is inert for DPS — it has no engine path", () => {
    const resist = attunementRows.find((row) => row.label === "Physical Resistance")!
    expect(resist.dpsDelta).toBeCloseTo(0, 6)
    expect(resist.leadVsMin).toBe("(none)")
  })

  it("leaves the caller's inputs untouched — the classSpecificAttunement tag map is cloned", () => {
    const before = JSON.stringify(umbraInputs.classSpecificAttunement)
    computeRanking(umbraInputs, base.dps)
    expect(JSON.stringify(umbraInputs.classSpecificAttunement)).toBe(before)
  })
})
