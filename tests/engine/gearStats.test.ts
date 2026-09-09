import { describe, expect, it } from "vitest"
import {
  applyPieceContribution,
  computeGearContribution,
  gearAttributeTotals,
  gearHpTotal,
  maxRelayedClone,
  relayedCapValue,
} from "../../src/engine/gearStats"
import { gearBaseStatsFor } from "../../src/data/stats/gearBaseStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { effectiveRates } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"
import { gearLevelForBreakthrough } from "../../src/definitions/baseStats/breakthroughs"
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

describe("formless attack words route to the class primary attribute attack", () => {
  const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

  function formlessAttackPiece(word: GearWordId | "", value: number): GearPiece {
    return {
      id: "formless-attack-piece",
      slot: "leftWeapon",
      level: 96,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "", value: 0, retuned: false },
        { word, value, retuned: true },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
  }

  const withoutWord = applyPieceContribution(inputs, formlessAttackPiece("", 0), +1)

  it("for bellstrikeUmbra (primary = Bellstrike), Min Formless Attack bumps bellstrike.min only", () => {
    const after = applyPieceContribution(inputs, formlessAttackPiece("minFormless", 30), +1)
    expect(after.bellstrike.min).toBeCloseTo(withoutWord.bellstrike.min + 30, 9)
    expect(after.bellstrike.max).toBeCloseTo(withoutWord.bellstrike.max, 9)
    expect(after.bamboocut.min).toBeCloseTo(withoutWord.bamboocut.min, 9)
    expect(after.phys.min).toBeCloseTo(withoutWord.phys.min, 9)
  })

  it("for bellstrikeUmbra (primary = Bellstrike), Max Formless Attack bumps bellstrike.max only", () => {
    const after = applyPieceContribution(inputs, formlessAttackPiece("maxFormless", 36.2), +1)
    expect(after.bellstrike.max).toBeCloseTo(withoutWord.bellstrike.max + 36.2, 9)
    expect(after.bellstrike.min).toBeCloseTo(withoutWord.bellstrike.min, 9)
    expect(after.bamboocut.max).toBeCloseTo(withoutWord.bamboocut.max, 9)
  })

  it("the word value scales linearly (value / spec.amount)", () => {
    const after = applyPieceContribution(inputs, formlessAttackPiece("maxFormless", 18.1), +1)
    expect(after.bellstrike.max).toBeCloseTo(withoutWord.bellstrike.max + 18.1, 9)
  })
})

describe("maxRelayedClone", () => {
  it("sets every populated word to 94 % of its WordSpec.amount and forces relayed=true", () => {
    const inputs = { ...defaultInputs }
    const piece = weaponPiece()
    const level = gearLevelForBreakthrough(inputs.breakthrough)
    const upgraded = maxRelayedClone(piece, inputs, level)
    const specs = getWordSpecs(inputs, level)

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

describe("a word outside the line's own pool scores as nothing", () => {
  function weaponPieceWithFirstLine(
    word: GearWordId | "",
    value: number,
    retuned: boolean,
  ): GearPiece {
    return {
      id: "test-first-line-weapon",
      slot: "leftWeapon",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word, value, retuned },
        { word: "momentum", value: 30, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
  }

  function sumPath(contribution: ReturnType<typeof computeGearContribution>, path: string): number {
    return contribution
      .filter((entry) => entry.path === path)
      .reduce((total, entry) => total + entry.amount, 0)
  }

  it("does not credit power on an un-retuned first line, but keeps crediting the second line's momentum", () => {
    const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    const baseOnlyMin = sumPath(
      computeGearContribution(weaponPieceWithFirstLine("", 0, false), inputs),
      "phys.min",
    )
    const contribution = computeGearContribution(
      weaponPieceWithFirstLine("power", 40, false),
      inputs,
    )
    expect(sumPath(contribution, "phys.min")).toBeCloseTo(baseOnlyMin, 10)
    expect(sumPath(contribution, "affinityRate")).toBeGreaterThan(0)
  })

  it("still does not credit power on the first line when it is marked retuned — the initial affix cannot be retuned", () => {
    const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    const baseOnlyMin = sumPath(
      computeGearContribution(weaponPieceWithFirstLine("", 0, false), inputs),
      "phys.min",
    )
    const contribution = computeGearContribution(
      weaponPieceWithFirstLine("power", 40, true),
      inputs,
    )
    expect(sumPath(contribution, "phys.min")).toBeCloseTo(baseOnlyMin, 10)
  })

  it("gearAttributeTotals drops power from an un-retuned first line but keeps the second line's momentum", () => {
    const totals = gearAttributeTotals([weaponPieceWithFirstLine("power", 40, false)])
    expect(totals.power).toBe(0)
    expect(totals.momentum).toBe(30)
  })

  it("gearHpTotal sums the base HP of every non-weapon slot and ignores weapon slots", () => {
    const armor = armorPiece()
    const weapon = weaponPiece()
    const expected = gearBaseStatsFor(armor).hp
    expect(gearHpTotal([armor, weapon])).toBe(expected)
  })

  it("gearHpTotal reads the level's base HP rather than the piece's own hp field", () => {
    const armor = { ...armorPiece(), hp: 999999 }
    expect(gearHpTotal([armor])).toBe(gearBaseStatsFor(armor).hp)
  })
})
