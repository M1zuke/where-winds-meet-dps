import { describe, expect, it } from "vitest"
import {
  applyPieceContribution,
  maxRelayedClone,
  relayedCapValue,
} from "../../src/engine/gearStats"
import { gearBaseStatsFor } from "../../src/data/stats/gearBaseStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { effectiveRates } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, GearWordId, Inputs } from "../../src/engine/types"

function weaponPiece(): GearPiece {
  return {
    id: "test-weapon",
    slot: "leftWeapon",
    level: 91,
    rarity: "legendary",
    minPhys: 100,
    maxPhys: 200,
    hp: 0,
    physDef: 0,
    words: [
      { word: "power", value: 30, retuned: false },
      { word: "agility", value: 20, retuned: false },
      { word: "crit", value: 0.05, retuned: false },
      { word: "damageVsBoss", value: 0.02, retuned: false },
      { word: "", value: 0, retuned: false },
    ],
    attunement: "",
    attunementValue: 0,
    relayed: false,
  }
}

function armorPiece(): GearPiece {
  return {
    id: "test-armor",
    slot: "helm",
    level: 91,
    rarity: "epic",
    minPhys: 0,
    maxPhys: 0,
    hp: 5000,
    physDef: 800,
    words: [
      { word: "momentum", value: 35, retuned: false },
      { word: "affinity", value: 0.025, retuned: false },
      { word: "allMartialBoost", value: 0.018, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
    ],
    attunement: "",
    attunementValue: 0,
    relayed: true,
  }
}

const FLOAT_TOL = 1e-9

function expectInputsClose(a: Inputs, b: Inputs): void {
  const aRec = a as unknown as Record<string, unknown>
  const bRec = b as unknown as Record<string, unknown>
  for (const k of Object.keys(aRec)) {
    const av = aRec[k]
    const bv = bRec[k]
    if (typeof av === "number" && typeof bv === "number") {
      expect(Math.abs(av - bv)).toBeLessThan(FLOAT_TOL)
    } else if (av && typeof av === "object" && bv && typeof bv === "object" && !Array.isArray(av)) {
      const ao = av as Record<string, unknown>
      const bo = bv as Record<string, unknown>
      for (const kk of Object.keys(ao)) {
        const ai = ao[kk]
        const bi = bo[kk]
        if (typeof ai === "number" && typeof bi === "number") {
          expect(Math.abs(ai - bi)).toBeLessThan(FLOAT_TOL)
        } else {
          expect(bi).toEqual(ai)
        }
      }
    } else {
      expect(bv).toEqual(av)
    }
  }
}

describe("applyPieceContribution", () => {
  it("equip + unequip round-trips a weapon piece back to the original Inputs", () => {
    const inputs = { ...defaultInputs }
    const piece = weaponPiece()
    const equipped = applyPieceContribution(inputs, piece, +1)
    const restored = applyPieceContribution(equipped, piece, -1)
    expectInputsClose(restored, inputs)
  })

  it("equip + unequip round-trips an armor piece back to the original Inputs", () => {
    const inputs = { ...defaultInputs }
    const piece = armorPiece()
    const equipped = applyPieceContribution(inputs, piece, +1)
    const restored = applyPieceContribution(equipped, piece, -1)
    expectInputsClose(restored, inputs)
  })

  it("equipping a weapon piece bumps phys.min and phys.max by the base stats", () => {
    const inputs = { ...defaultInputs }
    const piece = weaponPiece()
    const base = gearBaseStatsFor(piece)
    const after = applyPieceContribution(inputs, piece, +1)
    expect(after.phys.min).toBeGreaterThan(inputs.phys.min + base.minPhys - FLOAT_TOL)
    expect(after.phys.max).toBeGreaterThan(inputs.phys.max + base.maxPhys - FLOAT_TOL)
  })
})

// Gear contributions land on WHITE precision/critRate/affinityRate — see
// CLAUDE.md § "White vs Yellow rates".
describe("applyPieceContribution: white-side stat updates feed effectiveRates", () => {
  function ratesPiece(): GearPiece {
    return {
      id: "rates-piece",
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "precision", value: 0.074, retuned: false },
        { word: "crit", value: 0.074, retuned: false },
        { word: "affinity", value: 0.036, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
  }

  it("equipping bumps white precision / critRate / affinityRate by the spec amounts", () => {
    const inputs = { ...defaultInputs }
    const after = applyPieceContribution(inputs, ratesPiece(), +1)
    expect(after.precision).toBeCloseTo(inputs.precision + 0.074, 9)
    expect(after.critRate).toBeCloseTo(inputs.critRate + 0.074, 9)
    expect(after.affinityRate).toBeCloseTo(inputs.affinityRate + 0.036, 9)
  })

  it("yellow rates derived from the post-swap white values match the formula", () => {
    const inputs = { ...defaultInputs }
    const after = applyPieceContribution(inputs, ratesPiece(), +1)
    const r = 0.3
    const eff = effectiveRates(after)
    expect(eff.precision).toBeCloseTo((after.precision - 0.65) / (1 + r) + 0.65, 9)
    expect(eff.critRate).toBeCloseTo(after.critRate / (1 + r), 9)
    expect(eff.affinityRate).toBeCloseTo(after.affinityRate / (1 + r), 9)
  })
})

describe("formless penetration routes to the class primary attribute", () => {
  function penPiece(attunement: string, value: number): GearPiece {
    return {
      id: "pen-piece",
      slot: "leftWeapon",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement,
      attunementValue: value,
      relayed: false,
    }
  }

  it("for bellstrikeUmbra (primary = Bellstrike), bumps bellstrike.penetration and leaves phys.penetration unchanged", () => {
    const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    const after = applyPieceContribution(inputs, penPiece("formlessPen", 0.1), +1)
    expect(after.bellstrike.penetration).toBeCloseTo(inputs.bellstrike.penetration + 0.1, 9)
    expect(after.bamboocut.penetration).toBeCloseTo(inputs.bamboocut.penetration, 9)
    expect(after.phys.penetration).toBeCloseTo(inputs.phys.penetration, 9)
  })

  it("physPen still routes to phys.penetration (unaffected by the resolver)", () => {
    const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    const after = applyPieceContribution(inputs, penPiece("physPen", 0.07), +1)
    expect(after.phys.penetration).toBeCloseTo(inputs.phys.penetration + 0.07, 9)
    expect(after.bellstrike.penetration).toBeCloseTo(inputs.bellstrike.penetration, 9)
  })
})

describe("void attack words route to the class primary attribute attack", () => {
  function voidAttackPiece(word: GearWordId, value: number): GearPiece {
    return {
      id: "void-attack-piece",
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word, value, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
  }

  it("for bellstrikeUmbra (primary = Bellstrike), Min Void Attack bumps bellstrike.min only", () => {
    const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    const after = applyPieceContribution(inputs, voidAttackPiece("minVoidAttack", 30), +1)
    expect(after.bellstrike.min).toBeCloseTo(inputs.bellstrike.min + 30, 9)
    expect(after.bellstrike.max).toBeCloseTo(inputs.bellstrike.max, 9)
    expect(after.bamboocut.min).toBeCloseTo(inputs.bamboocut.min, 9)
    expect(after.phys.min).toBeCloseTo(inputs.phys.min, 9)
  })

  it("for bellstrikeUmbra (primary = Bellstrike), Max Void Attack bumps bellstrike.max only", () => {
    const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    const after = applyPieceContribution(inputs, voidAttackPiece("maxVoidAttack", 36.2), +1)
    expect(after.bellstrike.max).toBeCloseTo(inputs.bellstrike.max + 36.2, 9)
    expect(after.bellstrike.min).toBeCloseTo(inputs.bellstrike.min, 9)
    expect(after.bamboocut.max).toBeCloseTo(inputs.bamboocut.max, 9)
  })

  it("the word value scales linearly (value / spec.amount)", () => {
    const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    const after = applyPieceContribution(inputs, voidAttackPiece("maxVoidAttack", 18.1), +1)
    expect(after.bellstrike.max).toBeCloseTo(inputs.bellstrike.max + 18.1, 9)
  })
})

describe("maxRelayedClone", () => {
  it("sets every populated word to 94 % of its WordSpec.amount and forces relayed=true", () => {
    const inputs = { ...defaultInputs }
    const piece = weaponPiece()
    const upgraded = maxRelayedClone(piece, inputs)
    const specs = getWordSpecs(inputs)

    expect(upgraded.relayed).toBe(true)
    expect(upgraded.id).toBe(piece.id)

    for (let i = 0; i < piece.words.length; i++) {
      const u = upgraded.words[i]
      const original = piece.words[i]
      if (!original.word) {
        expect(u).toEqual(original)
        continue
      }
      const spec = specs.find((s) => s.word === original.word)
      if (!spec) {
        expect(u).toEqual(original)
        continue
      }
      expect(u.value).toBeCloseTo(relayedCapValue(spec.amount, spec.unit), 10)
    }
  })
})
