import { describe, expect, it } from "vitest"
import {
  ALL_REROLLABLE_SLOTS,
  annotatePoolForSlot,
  filterPoolForSlot,
  rerollableSlots,
  retuneAttemptBudget,
  retuneLineOutcome,
  retunePoolChoices,
} from "../../src/engine/retunement"
import { computeReattunement, computeRetunement } from "../../src/engine/dpsWorker"
import {
  ATTUNEMENT_OPTIONS,
  attunementMax,
  attunementMin,
  getAttunement,
} from "../../src/engine/attunements"
import { runEngine } from "../../src/engine/dps"
import {
  applyPieceContribution,
  maxRelayedClone,
  relayedCapValue,
} from "../../src/engine/gearStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { poolForClass } from "../../src/definitions/classes/registry"
import { defaultInputs } from "../../src/engine/defaults"
import { retuneWeightPool, type RetuneLine } from "../../src/data/stats/gearRetuneWeights"
import type { GearPiece, Inputs } from "../../src/engine/types"

const BELLSTRIKE_POOL = poolForClass("bellstrikeUmbra")!

function piece(words: GearPiece["words"], overrides: Partial<GearPiece> = {}): GearPiece {
  return {
    id: "test",
    slot: "helm",
    level: 91,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words,
    attunement: "",
    attunementValue: 0,
    relayed: false,
    ...overrides,
  }
}

function w(
  word: GearPiece["words"][number]["word"],
  value = 0,
  retuned = false,
): GearPiece["words"][number] {
  return { word, value, retuned }
}

const EMPTY = w("", 0)

describe("filterPoolForSlot", () => {
  it("returns the full Bellstrike pool when no stat is yet on the gear", () => {
    const p = piece([EMPTY, EMPTY, EMPTY, EMPTY, EMPTY])
    for (const slot of ALL_REROLLABLE_SLOTS) {
      const f = filterPoolForSlot(p, slot, BELLSTRIKE_POOL)
      expect(f.candidates).toEqual(BELLSTRIKE_POOL.stats)
      expect(f.poolSize).toBe(BELLSTRIKE_POOL.stats.length)
    }
  })

  it("allows the first-slot stat to appear once more in slots 2-5", () => {
    const p = piece([w("crit", 0.07), EMPTY, EMPTY, EMPTY, EMPTY])
    for (const slot of ALL_REROLLABLE_SLOTS) {
      const f = filterPoolForSlot(p, slot, BELLSTRIKE_POOL)
      expect(f.candidates).toContain("crit")
    }
  })

  it("forbids a third copy when the first-slot stat already appears twice", () => {
    const p = piece([w("crit", 0.07), w("crit", 0.05), EMPTY, EMPTY, EMPTY])
    const f3 = filterPoolForSlot(p, 2, BELLSTRIKE_POOL)
    const f4 = filterPoolForSlot(p, 3, BELLSTRIKE_POOL)
    const f5 = filterPoolForSlot(p, 4, BELLSTRIKE_POOL)
    expect(f3.candidates).not.toContain("crit")
    expect(f4.candidates).not.toContain("crit")
    expect(f5.candidates).not.toContain("crit")
    const f2 = filterPoolForSlot(p, 1, BELLSTRIKE_POOL)
    expect(f2.candidates).toContain("crit")
  })

  it("blocks duplicates of any non-first-slot stat", () => {
    const p = piece([w("crit", 0.07), w("momentum", 35), EMPTY, EMPTY, EMPTY])
    expect(filterPoolForSlot(p, 2, BELLSTRIKE_POOL).candidates).not.toContain("momentum")
    expect(filterPoolForSlot(p, 3, BELLSTRIKE_POOL).candidates).not.toContain("momentum")
    expect(filterPoolForSlot(p, 4, BELLSTRIKE_POOL).candidates).not.toContain("momentum")
    expect(filterPoolForSlot(p, 1, BELLSTRIKE_POOL).candidates).toContain("momentum")
  })

  it("treats empty slots as having no stat", () => {
    const p = piece([w("crit", 0.07), EMPTY, w("power", 35), EMPTY, EMPTY])
    expect(filterPoolForSlot(p, 1, BELLSTRIKE_POOL).candidates).not.toContain("power")
    expect(filterPoolForSlot(p, 3, BELLSTRIKE_POOL).candidates).not.toContain("power")
    expect(filterPoolForSlot(p, 4, BELLSTRIKE_POOL).candidates).not.toContain("power")
    expect(filterPoolForSlot(p, 2, BELLSTRIKE_POOL).candidates).toContain("power")
    expect(filterPoolForSlot(p, 1, BELLSTRIKE_POOL).candidates).toContain("momentum")
  })

  it("covers the listed Bellstrike pool", () => {
    expect(BELLSTRIKE_POOL.stats).toEqual([
      "affinity",
      "maxPhys",
      "momentum",
      "maxBellstrike",
      "power",
      "crit",
    ])
  })
})

describe("rerollableSlots", () => {
  it("returns all of slots 1..4 when no slot is R-marked", () => {
    const p = piece([w("crit", 0.07), w("agility", 35), w("momentum", 35), EMPTY, EMPTY])
    expect(rerollableSlots(p)).toEqual([1, 2, 3, 4])
  })

  it("returns only the R-marked slot when one slot has retuned=true", () => {
    const p = piece([w("crit", 0.07), w("agility", 35), w("momentum", 35, true), EMPTY, EMPTY])
    expect(rerollableSlots(p)).toEqual([2])
  })

  it("ignores R-flag on slot 0 (first tunement is always locked)", () => {
    const p = piece([w("crit", 0.07, true), w("agility", 35), w("momentum", 35), EMPTY, EMPTY])
    expect(rerollableSlots(p)).toEqual([1, 2, 3, 4])
  })

  it("returns multiple slots only if multiple R-flags exist (data-error tolerant)", () => {
    const p = piece([
      w("crit", 0.07),
      w("agility", 35, true),
      w("momentum", 35, true),
      EMPTY,
      EMPTY,
    ])
    expect(rerollableSlots(p)).toEqual([1, 2])
  })
})

describe("annotatePoolForSlot", () => {
  it("flags the current slot's stat with isCurrent", () => {
    const p = piece([w("crit", 0.07), w("power", 35), EMPTY, EMPTY, EMPTY])
    const annotated = annotatePoolForSlot(p, 1, BELLSTRIKE_POOL)
    const min = annotated.find((a) => a.word === "power")
    expect(min?.isCurrent).toBe(true)
    expect(min?.legal).toBe(true)
  })

  it("returns one entry per pool stat regardless of legality", () => {
    const p = piece([w("crit", 0.07), w("momentum", 35), EMPTY, EMPTY, EMPTY])
    const annotated = annotatePoolForSlot(p, 2, BELLSTRIKE_POOL)
    expect(annotated).toHaveLength(BELLSTRIKE_POOL.stats.length)
    expect(annotated.find((a) => a.word === "momentum")?.legal).toBe(false)
  })
})

describe("computeRetunement (worker compute)", () => {
  function withPieceInInventory(p: GearPiece): Inputs {
    return { ...defaultInputs, inventory: [p] }
  }

  it("returns empty rows for relayed pieces", () => {
    const p = piece([w("crit", 0.07), w("power", 35), EMPTY, EMPTY, EMPTY], { relayed: true })
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    expect(res.reason).toBe("relayed")
    expect(res.rows).toEqual([])
  })

  it("returns empty rows when the class has no pool entry", () => {
    const p = piece([w("crit", 0.07), w("power", 35), EMPTY, EMPTY, EMPTY])
    const inputs = { ...withPieceInInventory(p), classId: "noSuchClass" }
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    expect(res.reason).toBe("no-pool")
    expect(res.rows).toEqual([])
  })

  it("emits 4 × poolSize rows for a non-relayed Bellstrike piece with no R-flag", () => {
    const p = piece([w("crit", 0.07), w("power", 35), EMPTY, EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    expect(res.reason).toBe("ok")
    expect(res.rows).toHaveLength(ALL_REROLLABLE_SLOTS.length * BELLSTRIKE_POOL.stats.length)
  })

  it("emits only 1 × poolSize rows when an R-toggle locks a single slot", () => {
    const p = piece([w("crit", 0.07), w("power", 35), w("momentum", 35, true), EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    expect(res.reason).toBe("ok")
    expect(res.rows).toHaveLength(BELLSTRIKE_POOL.stats.length)
    expect(new Set(res.rows.map((r) => r.slotIndex))).toEqual(new Set([2]))
  })

  it("reports ~0 ΔDPS for a candidate identical to the slot's current word", () => {
    const specs = getWordSpecs(defaultInputs, 91)
    const minSpec = specs.find((s) => s.word === "power")!
    const p = piece([w("crit", 0.07), w("power", minSpec.amount), EMPTY, EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    const row = res.rows.find((r) => r.slotIndex === 1 && r.word === "power")
    expect(row).toBeDefined()
    expect(row!.legal).toBe(true)
    expect(row!.isCurrent).toBe(true)
    expect(Math.abs(row!.deltaDps)).toBeLessThan(1e-6)
    expect(Math.abs(row!.deltaDpsRelayed)).toBeLessThan(1e-6)
  })

  it("scores the 94% column against the piece relayed, candidate capped alongside the rest", () => {
    const p = piece([w("crit", 0.07), w("power", 35), EMPTY, EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })

    const targetSpec = getWordSpecs(inputs, p.level).find((s) => s.word === "maxBellstrike")!
    const relayed = maxRelayedClone(p, inputs, p.level)
    const relayedSwapped: GearPiece = {
      ...relayed,
      words: relayed.words.map((wd, i) =>
        i === 2
          ? {
              word: "maxBellstrike",
              value: relayedCapValue(targetSpec.amount, targetSpec.unit),
              retuned: true,
            }
          : wd,
      ) as GearPiece["words"],
    }
    const relayedDps = runEngine(applyPieceContribution(inputs, relayed, +1)).dps
    const swappedDps = runEngine(applyPieceContribution(inputs, relayedSwapped, +1)).dps

    const workerRow = res.rows.find((r) => r.slotIndex === 2 && r.word === "maxBellstrike")!
    expect(workerRow.legal).toBe(true)
    expect(Math.abs(workerRow.deltaDpsRelayed - (swappedDps - relayedDps))).toBeLessThan(1e-6)
  })

  it("agrees with the virtually-equipped baseline on a hand-rolled swap", () => {
    const p = piece([w("crit", 0.07), w("power", 35), EMPTY, EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })

    const specs = getWordSpecs(inputs, p.level)
    const targetSpec = specs.find((s) => s.word === "maxBellstrike")!
    const swappedWords = p.words.map((wd, i) =>
      i === 2 ? { word: "maxBellstrike", value: targetSpec.amount, retuned: true } : wd,
    ) as GearPiece["words"]
    const swapped: GearPiece = { ...p, words: swappedWords }
    const equipDps = runEngine(applyPieceContribution(inputs, p, +1)).dps
    const swappedDps = runEngine(applyPieceContribution(inputs, swapped, +1)).dps
    const handRolledDelta = swappedDps - equipDps

    const workerRow = res.rows.find((r) => r.slotIndex === 2 && r.word === "maxBellstrike")!
    expect(workerRow.legal).toBe(true)
    expect(Math.abs(workerRow.deltaDps - handRolledDelta)).toBeLessThan(1e-6)
  })

  it("marks illegal candidates with deltaDps 0", () => {
    const p = piece([w("power", 35), w("power", 30), EMPTY, EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    const illegalSlot3 = res.rows.find((r) => r.slotIndex === 2 && r.word === "power")!
    expect(illegalSlot3.legal).toBe(false)
    expect(illegalSlot3.deltaDps).toBe(0)
  })
})

describe("computeReattunement", () => {
  function withPieceInInventory(p: GearPiece): Inputs {
    return { ...defaultInputs, inventory: [p] }
  }

  function weaponPiece(overrides: Partial<GearPiece> = {}): GearPiece {
    return piece([w("crit", 0.07), w("agility", 35), w("momentum", 35), EMPTY, EMPTY], {
      slot: "leftWeapon",
      minPhys: 1000,
      maxPhys: 2000,
      ...overrides,
    })
  }

  it("returns no-pool when the slot/class has no attunement options", () => {
    const armor = piece([w("crit", 0.07), w("agility", 35), EMPTY, EMPTY, EMPTY], {
      slot: "greaves",
      hp: 5000,
      physDef: 800,
      minPhys: 0,
      maxPhys: 0,
    })
    const inputs = { ...withPieceInInventory(armor), classId: "noSuchClass" }
    const res = computeReattunement({ reqId: 1, inputs, pieceId: armor.id })
    expect(res.reason).toBe("no-pool")
    expect(res.options).toEqual([])
  })

  it("emits one option per pool entry for a weapon slot", () => {
    const wp = weaponPiece({ attunement: "physPen", attunementValue: 0.07 })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })
    expect(res.reason).toBe("ok")
    expect(res.options.map((o) => o.optionId).sort()).toEqual(
      ["formlessPen", "physPen", "physResist"].sort(),
    )
    const physPen = res.options.find((o) => o.optionId === "physPen")!
    expect(physPen.isCurrent).toBe(true)
    expect(physPen.inert).toBe(false)
    const physResist = res.options.find((o) => o.optionId === "physResist")!
    expect(physResist.inert).toBe(true)
  })

  it("agrees with the virtually-equipped baseline on headline ΔDPS at max value", () => {
    const wp = weaponPiece({ attunement: "physPen", attunementValue: 0.07 })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })

    const opt = getAttunement("physPen")!
    const swapped: GearPiece = {
      ...wp,
      attunement: "physPen",
      attunementValue: attunementMax(opt, wp.level),
    }
    const equipDps = runEngine(applyPieceContribution(inputs, wp, +1)).dps
    const swappedDps = runEngine(applyPieceContribution(inputs, swapped, +1)).dps
    const handDelta = swappedDps - equipDps

    const physPen = res.options.find((o) => o.optionId === "physPen")!
    expect(Math.abs(physPen.deltaDpsAtMax - handDelta)).toBeLessThan(1e-6)
  })

  it("reports per-option probability of 0 for inert attunements when current option is non-inert", () => {
    const wp = weaponPiece({ attunement: "physPen", attunementValue: 0.07 })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })
    const physResist = res.options.find((o) => o.optionId === "physResist")!
    expect(physResist.probImproveGivenOption).toBe(0)
  })

  it("computes overall probability as the mean of per-option conditional rates", () => {
    const wp = weaponPiece({ attunement: "physPen", attunementValue: 0.07 })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })
    const mean =
      res.options.reduce((acc, o) => acc + o.probImproveGivenOption, 0) / res.options.length
    expect(Math.abs(res.probImproveOverall - mean)).toBeLessThan(1e-9)
    expect(res.probImproveOverall).toBeLessThanOrEqual(2 / res.options.length + 1e-9)
  })

  it("reports a per-option probability strictly between 0 and 1 when current value is mid-range", () => {
    const opt = getAttunement("physPen")!
    const min = attunementMin(opt, 91)
    const max = attunementMax(opt, 91)
    const wp = weaponPiece({ attunement: "physPen", attunementValue: min })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })
    const physPen = res.options.find((o) => o.optionId === "physPen")!
    expect(physPen.probImproveGivenOption).toBeGreaterThan(0.999)

    const wp2 = weaponPiece({
      attunement: "physPen",
      attunementValue: (min + max) / 2,
    })
    const inputs2 = withPieceInInventory(wp2)
    const res2 = computeReattunement({ reqId: 1, inputs: inputs2, pieceId: wp2.id })
    const physPen2 = res2.options.find((o) => o.optionId === "physPen")!
    expect(Math.abs(physPen2.probImproveGivenOption - 0.5)).toBeLessThan(0.02)
  })

  it("ATTUNEMENT_OPTIONS catalog is non-empty (sanity)", () => {
    expect(ATTUNEMENT_OPTIONS.length).toBeGreaterThan(0)
  })
})

describe("retuneAttemptBudget", () => {
  it("is single at 86 and repeatable from 91 up", () => {
    expect(retuneAttemptBudget(86)).toBe("single")
    expect(retuneAttemptBudget(91)).toBe("repeatable")
    expect(retuneAttemptBudget(96)).toBe("repeatable")
    expect(retuneAttemptBudget(100)).toBe("repeatable")
    expect(retuneAttemptBudget(105)).toBe("repeatable")
  })
})

describe("retunePoolChoices", () => {
  const bellstrikeWeaponPool = retuneWeightPool("Bellstrike", 96, "leftWeapon")!

  function bareWeaponPiece(overrides: Partial<GearPiece> = {}): GearPiece {
    return piece([EMPTY, EMPTY, EMPTY, EMPTY, EMPTY], {
      slot: "leftWeapon",
      level: 96,
      ...overrides,
    })
  }

  it("shows every pool line, summing to 1, when nothing is equipped or deselected", () => {
    const choices = retunePoolChoices(bareWeaponPiece(), bellstrikeWeaponPool)
    expect(choices.map((c) => c.word).sort()).toEqual(
      bellstrikeWeaponPool.map((l) => l.word).sort(),
    )
    expect(choices.reduce((sum, c) => sum + c.pDraw, 0)).toBeCloseTo(1, 6)
  })

  it("keeps a line already sitting on another row visible, at 0 chance and out of the denominator", () => {
    const withCrit = bareWeaponPiece({
      words: [w("crit", 0.05), EMPTY, EMPTY, EMPTY, EMPTY],
    })
    const choices = retunePoolChoices(withCrit, bellstrikeWeaponPool)
    const crit = choices.find((c) => c.word === "crit")!
    expect(crit.onPiece).toBe(true)
    expect(crit.pDraw).toBe(0)
    const drawn = choices.filter((c) => c.pDraw > 0)
    expect(drawn.reduce((sum, c) => sum + c.pDraw, 0)).toBeCloseTo(1, 10)
  })

  it("shows a deselected line struck through — 0 chance, excluded from the denominator", () => {
    const withHistory = bareWeaponPiece({ retunedOutWords: ["momentum"] })
    const momentum = retunePoolChoices(withHistory, bellstrikeWeaponPool).find(
      (c) => c.word === "momentum",
    )!
    expect(momentum.deselected).toBe(true)
    expect(momentum.pDraw).toBe(0)
  })

  it("deselecting momentum rebalances the rest to the documented shares", () => {
    const withHistory = bareWeaponPiece({ retunedOutWords: ["momentum"] })
    const choices = retunePoolChoices(withHistory, bellstrikeWeaponPool)
    const shareOf = (word: string) => choices.find((c) => c.word === word)!.pDraw
    expect(shareOf("maxFormless")).toBeCloseTo(0.292, 3)
    expect(shareOf("maxPhys")).toBeCloseTo(0.22, 3)
    expect(shareOf("crit")).toBeCloseTo(0.206, 3)
    expect(shareOf("affinity")).toBeCloseTo(0.206, 3)
    expect(shareOf("power")).toBeCloseTo(0.074, 3)
  })
})

describe("retuneLineOutcome", () => {
  const syntheticLine: RetuneLine = {
    word: "power",
    weight: 100,
    bands: [
      { min: 0, max: 10, star5Weight: 0, lowerStarWeight: 40 },
      { min: 10, max: 20, star5Weight: 60, lowerStarWeight: 50 },
      { min: 20, max: 30, star5Weight: 40, lowerStarWeight: 10 },
    ],
  }

  it("reports pImprove 1 when every band already clears the baseline", () => {
    const outcome = retuneLineOutcome(syntheticLine, "legendary", -1, (value) => value)
    expect(outcome.pImprove).toBe(1)
  })

  it("reports pImprove 0 when every band stays under the baseline", () => {
    const outcome = retuneLineOutcome(syntheticLine, "legendary", 1000, (value) => value)
    expect(outcome.pImprove).toBe(0)
  })

  it("weights the expected drawn value by rarity's own band weights", () => {
    const star5 = retuneLineOutcome(syntheticLine, "legendary", 0, (value) => value)
    const lowerStar = retuneLineOutcome(syntheticLine, "epic", 0, (value) => value)
    // 5★ zeroes band 1 (0/60/40): E[value] = 0.6·15 + 0.4·25 = 19
    expect(star5.eDeltaDpsGivenDrawn).toBeCloseTo(19, 6)
    // 3★/4★ weights 40/50/10: E[value] = 0.4·5 + 0.5·15 + 0.1·25 = 12
    expect(lowerStar.eDeltaDpsGivenDrawn).toBeCloseTo(12, 6)
  })
})

describe("computeRetunement — weighted advisor (levels 96/100/105)", () => {
  function withPieceInInventory(p: GearPiece): Inputs {
    return { ...defaultInputs, inventory: [p], classId: "bellstrikeUmbra" }
  }

  function weightedWeaponPiece(overrides: Partial<GearPiece> = {}): GearPiece {
    return piece([w("power", 30), EMPTY, EMPTY, EMPTY, EMPTY], {
      slot: "leftWeapon",
      level: 96,
      minPhys: 100,
      maxPhys: 200,
      ...overrides,
    })
  }

  it("returns null pDraw/pImprove/eDeltaDps at level 91 (no weighted data)", () => {
    const p = weightedWeaponPiece({ level: 91 })
    const res = computeRetunement({ reqId: 1, inputs: withPieceInInventory(p), pieceId: p.id })
    expect(res.reason).toBe("ok")
    expect(res.rows.length).toBeGreaterThan(0)
    for (const row of res.rows) {
      expect(row.pDraw).toBeNull()
      expect(row.pImprove).toBeNull()
      expect(row.eDeltaDps).toBeNull()
    }
  })

  it("emits numeric pDraw/pImprove/eDeltaDps at level 96", () => {
    const p = weightedWeaponPiece()
    const res = computeRetunement({ reqId: 1, inputs: withPieceInInventory(p), pieceId: p.id })
    expect(res.reason).toBe("ok")
    expect(res.rows.length).toBeGreaterThan(0)
    for (const row of res.rows) {
      expect(typeof row.pDraw).toBe("number")
      expect(typeof row.pImprove).toBe("number")
      expect(typeof row.eDeltaDps).toBe("number")
    }
  })

  it("pDraw sums to 1 across the candidates offered for one slot", () => {
    const p = weightedWeaponPiece()
    const res = computeRetunement({ reqId: 1, inputs: withPieceInInventory(p), pieceId: p.id })
    const rowsForSlot1 = res.rows.filter((row) => row.slotIndex === 1)
    const total = rowsForSlot1.reduce((sum, row) => sum + (row.pDraw ?? 0), 0)
    expect(total).toBeCloseTo(1, 6)
  })

  it("never offers a line unreachable by retuning", () => {
    const p = weightedWeaponPiece()
    const res = computeRetunement({ reqId: 1, inputs: withPieceInInventory(p), pieceId: p.id })
    const words = new Set(res.rows.map((row) => row.word))
    expect(words.has("precision")).toBe(false)
    expect(words.has("swordBoost")).toBe(false)
  })

  it("excludes a word already on the piece from every slot's rows", () => {
    const p = weightedWeaponPiece()
    const res = computeRetunement({ reqId: 1, inputs: withPieceInInventory(p), pieceId: p.id })
    expect(res.rows.some((row) => row.word === "power")).toBe(false)
  })
})
