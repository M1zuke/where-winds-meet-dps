import { describe, expect, it } from "vitest"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"
import { getAttunement } from "../../src/engine/attunements"
import { defaultInputs } from "../../src/engine/defaults"
import { gearBaseStatsFor } from "../../src/data/stats/gearBaseStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { runEngine } from "../../src/engine/dps"
import { computeGraduation } from "../../src/engine/dpsWorker"
import { graduationInputs } from "../../src/engine/graduation"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { GEAR_SLOTS } from "../../src/engine/types"

function dpsFor(inputs = defaultInputs): number {
  return runEngine(applyBowSet(applyArmorSet(withDerivedStats(inputs)))).dps
}

describe("graduation builds", () => {
  it.each(CLASS_DEFS().map((classDef) => [classDef.id, classDef] as const))(
    "%s defines one best-in-slot piece for every gear slot",
    (_classId, classDef) => {
      expect(classDef.graduationBuild.gear.map((piece) => piece.slot).sort()).toEqual(
        [...GEAR_SLOTS].sort(),
      )
      expect(new Set(classDef.graduationBuild.gear.map((piece) => piece.id)).size).toBe(
        GEAR_SLOTS.length,
      )
      expect(classDef.graduationBuild.gear.every((piece) => piece.words.length === 5)).toBe(true)
    },
  )

  it.each(CLASS_DEFS().map((classDef) => [classDef.id, classDef] as const))(
    "%s rolls every graduation word and attunement at the catalogue's max",
    (classId, classDef) => {
      const specs = getWordSpecs({ ...defaultInputs, classId })
      for (const piece of classDef.graduationBuild.gear) {
        for (const word of piece.words) {
          const spec = specs.find((candidate) => candidate.word === word.word)
          expect(
            spec,
            `${piece.slot} names ${word.word}, which this class cannot roll`,
          ).toBeDefined()
          expect(word.value).toBe(spec!.amount)
        }
        expect(piece.attunementValue).toBe(getAttunement(piece.attunement)?.max)
      }
    },
  )

  it.each(CLASS_DEFS().map((classDef) => [classDef.id, classDef] as const))(
    "%s equips lv96 legendary base stats straight from the gear table",
    (_classId, classDef) => {
      for (const piece of classDef.graduationBuild.gear) {
        expect(piece.level).toBe(96)
        expect(piece.rarity).toBe("legendary")
        expect(piece).toMatchObject(gearBaseStatsFor(piece))
      }
    },
  )

  it("always enables every class talent and oddity", () => {
    const benchmarkInputs = graduationInputs(defaultInputs)
    expect(benchmarkInputs).not.toBeNull()
    expect(benchmarkInputs!.martialArtsTalents.length).toBeGreaterThan(0)
    expect(benchmarkInputs!.martialArtsTalents.every((talent) => talent.enabled)).toBe(true)
    expect(
      Object.values(benchmarkInputs!.oddities)
        .flat()
        .every((oddity) => oddity.enabled),
    ).toBe(true)
  })
})

describe("computeGraduation", () => {
  it("matches the direct benchmark pipeline and current-to-theoretical ratio", () => {
    const currentDps = dpsFor()
    const benchmarkInputs = graduationInputs(defaultInputs)
    expect(benchmarkInputs).not.toBeNull()
    const theoreticalDps = dpsFor(benchmarkInputs!)
    expect(theoreticalDps).toBeGreaterThan(currentDps)

    const response = computeGraduation({ reqId: 17, inputs: defaultInputs, currentDps })

    expect(response.reqId).toBe(17)
    expect(response.theoreticalDps).toBe(theoreticalDps)
    expect(response.graduationRate).toBe(currentDps / theoreticalDps)
    expect(response.graduationRate).toBeGreaterThan(0)
    expect(response.graduationRate).toBeLessThan(1)
  })
})
