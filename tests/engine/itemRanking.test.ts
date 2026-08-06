// The two class-specific weapon-boost rows are driven by the resolved
// active-or-default rotation's most-used weapons (`rotationWeapons` in
// `itemRanking.ts`), not `schools.json`'s static weapon list — the two can
// differ, so this asserts against what the rotation actually casts.
import { describe, expect, it } from "vitest"
import { computeRanking, getWordSpecs } from "../../src/engine/itemRanking"
import { computeGearContribution } from "../../src/engine/gearStats"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes"). `defaultInputs` itself is a bamboocutWindTwinblade build.
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

describe("computeRanking — Bellstrike Umbra baseline rows", () => {
  const base = runEngine(umbraInputs)
  const rows = computeRanking(umbraInputs, base.dps)

  it("produces a row per gear word", () => {
    expect(rows.length).toBe(27)
  })

  it("includes the default rotation's resolved weapon labels (Sword + Spear)", () => {
    expect(rows.some((r) => r.word === "Sword Martial Boost")).toBe(true)
    expect(rows.some((r) => r.word === "Spear Martial Boost")).toBe(true)
  })

  it("Precision (already at 100 %) caps at (none) — no positive lift", () => {
    const precision = rows.find((r) => r.word === "Precision")!
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

describe("computeRanking — top-rank consistency", () => {
  const base = runEngine(umbraInputs)
  const rows = computeRanking(umbraInputs, base.dps)
  const sorted = [...rows].sort((a, b) => b.liftPercent - a.liftPercent)
  const top10 = new Set(sorted.slice(0, 10).map((r) => r.word))

  it("Physical Penetration ranks in the top 10", () =>
    expect(top10.has("Physical Penetration")).toBe(true))
  it("Max Phys ranks in the top 10", () => expect(top10.has("Max Phys")).toBe(true))
  it("Sword Martial Boost ranks in the top 10", () =>
    expect(top10.has("Sword Martial Boost")).toBe(true))
  it("All Martial Boost ranks in the top 10", () =>
    expect(top10.has("All Martial Boost")).toBe(true))
})

// `WordSpec.amount` and the `apply` delta must stay in lockstep, since
// `computeGearContribution` scales the delta by `value / amount`.
describe("Single-Target Mystic Skill DMG Boost — max roll", () => {
  const specs = getWordSpecs(umbraInputs)

  it("is pinned at 11 %, while the two area mystic words stay at 7 %", () => {
    const single = specs.find((s) => s.word === "Single-Target Mystic Skill DMG Boost")!
    expect(single.unit).toBe("percent")
    expect(single.amount).toBeCloseTo(0.11, 10)

    const areaDebuff = specs.find((s) => s.word === "Area Debuff Mystic Skill DMG Boost")!
    const areaDamage = specs.find((s) => s.word === "Area DMG Mystic Skill DMG Boost")!
    expect(areaDebuff.amount).toBeCloseTo(0.07, 10)
    expect(areaDamage.amount).toBeCloseTo(0.07, 10)
  })

  it("a piece rolled at the new max contributes the full 0.11 to singleMysticBoost", () => {
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
        { word: "Single-Target Mystic Skill DMG Boost", value: 0.11, retuned: false },
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
    expect(entry?.amount).toBeCloseTo(0.11, 10)
  })
})
