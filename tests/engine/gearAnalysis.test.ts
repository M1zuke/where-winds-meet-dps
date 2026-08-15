import { describe, expect, it } from "vitest"
import { computeGearAnalysis } from "../../src/engine/gearAnalysis"
import { computeReattunement, computeRetunement } from "../../src/engine/dpsWorker"
import { runEngine } from "../../src/engine/dps"
import { applyPieceContribution, maxRelayedClone } from "../../src/engine/gearStats"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, GearSlot, Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

function word(name: GearPiece["words"][number]["word"], value = 0): GearPiece["words"][number] {
  return { word: name, value, retuned: false }
}
const EMPTY = word("", 0)

function piece(id: string, slot: GearSlot, overrides: Partial<GearPiece> = {}): GearPiece {
  return {
    id,
    slot,
    level: 91,
    rarity: "legendary",
    minPhys: 1000,
    maxPhys: 2000,
    hp: 0,
    physDef: 0,
    words: [word("crit", 0.03), word("power", 40), EMPTY, EMPTY, EMPTY],
    attunement: "physPen",
    attunementValue: 0.03,
    relayed: false,
    ...overrides,
  }
}

function equip(pieces: GearPiece[]): Inputs {
  const equipped = { ...umbraInputs.equipped }
  for (const equippedPiece of pieces) equipped[equippedPiece.slot] = equippedPiece.id
  return { ...umbraInputs, inventory: pieces, equipped }
}

const weapon = piece("weapon", "leftWeapon")
const helm = piece("helm", "helm", {
  words: [word("maxPhys", 60), word("momentum", 30), EMPTY, EMPTY, EMPTY],
})
const geared = equip([weapon, helm])
const gearedDps = runEngine(geared).dps
const rows = computeGearAnalysis(geared, gearedDps)

function rowFor(slot: GearSlot) {
  return rows.find((row) => row.slot === slot)!
}

describe("computeGearAnalysis", () => {
  it("covers every gear slot exactly once", () => {
    expect(rows.map((row) => row.slot)).toEqual([...new Set(rows.map((row) => row.slot))])
    expect(rows).toHaveLength(8)
  })

  it("leaves a slot with nothing equipped without a piece or any gain", () => {
    const empty = rowFor("bracer")
    expect(empty.pieceId).toBeNull()
    expect(empty.retuneGain).toBeNull()
    expect(empty.reattuneGain).toBeNull()
    expect(empty.relayGain).toBeNull()
    expect(empty.unequipLoss).toBe(0)
  })

  it("scores the retune gain as the best legal reroll the per-piece analyzer offers", () => {
    const analyzed = computeRetunement({ reqId: 1, inputs: geared, pieceId: weapon.id })
    const best = Math.max(
      ...analyzed.rows.filter((row) => row.legal && !row.isCurrent).map((row) => row.deltaDps),
    )

    expect(rowFor("leftWeapon").retuneGain).toBeCloseTo(best, 3)
  })

  it("scores the re-attune gain as the best attunement at its maximum roll", () => {
    const analyzed = computeReattunement({ reqId: 1, inputs: geared, pieceId: helm.id })
    const best = Math.max(...analyzed.options.map((option) => option.deltaDpsAtMax))

    expect(rowFor("helm").reattuneGain).toBeCloseTo(best, 3)
  })

  it("scores the relay gain against the piece's max-relayed clone", () => {
    const slotEmpty = applyPieceContribution(geared, weapon, -1)
    const relayed = maxRelayedClone(weapon, geared)
    const expected = runEngine(applyPieceContribution(slotEmpty, relayed, +1)).dps - gearedDps

    expect(rowFor("leftWeapon").relayGain).toBeCloseTo(expected, 3)
  })

  it("scores the tuned-stat loss as the DPS the build gives up with the slot emptied", () => {
    const expected = gearedDps - runEngine(applyPieceContribution(geared, helm, -1)).dps

    expect(rowFor("helm").unequipLoss).toBeCloseTo(expected, 3)
    expect(rowFor("helm").unequipLoss).toBeGreaterThan(0)
  })

  it("offers neither a retune nor a relay on an already relayed piece", () => {
    const relayedWeapon = { ...weapon, relayed: true }
    const relayedRows = computeGearAnalysis(
      equip([relayedWeapon, helm]),
      runEngine(equip([relayedWeapon, helm])).dps,
    )
    const row = relayedRows.find((candidate) => candidate.slot === "leftWeapon")!

    expect(row.retuneGain).toBeNull()
    expect(row.relayGain).toBeNull()
    expect(row.reattuneGain).not.toBeNull()
  })
})
