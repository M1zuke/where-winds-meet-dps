import { describe, expect, it } from "vitest"
import { CLASS_DEFS, classDefinition } from "../../src/definitions/classes/registry"
import { getAttunement } from "../../src/engine/attunements"
import { defaultInputs } from "../../src/engine/defaults"
import { gearBaseStatsFor } from "../../src/data/stats/gearBaseStats"
import { GEAR_WORD_MAX_ROLL, GEAR_WORD_UNIT } from "../../src/data/stats/gearWordRolls"
import { relayedCapValue } from "../../src/engine/gearStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { runEngine } from "../../src/engine/dps"
import { computeGraduation } from "../../src/engine/dpsWorker"
import { graduationBuild, graduationInputs } from "../../src/engine/graduation"
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

  it.each(CLASS_DEFS().map((classDef) => [classDef.id, classDef] as const))(
    "%s relays every graduation word to the shared relayed cap and keeps its attunement at max",
    (classId, classDef) => {
      const relayed = graduationBuild(classId, "relayed")
      expect(relayed).not.toBeNull()

      for (const piece of relayed!.gear) {
        expect(piece.relayed).toBe(true)
        for (const word of piece.words) {
          if (!word.word) continue
          expect(word.value).toBe(
            relayedCapValue(GEAR_WORD_MAX_ROLL[word.word], GEAR_WORD_UNIT[word.word]),
          )
        }
        expect(piece.attunementValue).toBe(getAttunement(piece.attunement)?.max)
      }
      expect(relayed!.gear.map((piece) => piece.id)).toEqual(
        classDef.graduationBuild.gear.map((piece) => piece.id),
      )
    },
  )

  it.each(CLASS_DEFS().map((classDef) => [classDef.id, classDef] as const))(
    "%s takes its relayed set, bow set and arsenal from the relayed overrides",
    (classId, classDef) => {
      const build = classDef.graduationBuild
      const overrides = build.relayedOverrides ?? {}
      const relayed = graduationBuild(classId, "relayed")

      expect(relayed!.set).toBe(overrides.set ?? build.set)
      expect(relayed!.bowSet).toBe(overrides.bowSet ?? build.bowSet)
      expect(relayed!.arsenal).toBe(overrides.arsenal ?? build.arsenal)
    },
  )

  it("leaves the max-roll variant untouched by the relayed overrides", () => {
    const build = graduationBuild("bellstrikeUmbra", "maxRolls")
    expect(build).toBe(classDefinition("bellstrikeUmbra")!.graduationBuild)
    expect(build!.bowSet).toBe("crit")
    expect(graduationBuild("bellstrikeUmbra", "relayed")!.bowSet).toBe("affinity")
  })

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

  it("reports the relayed benchmark alongside the max-roll one, and rates against max rolls", () => {
    const currentDps = dpsFor()
    const relayedInputs = graduationInputs(defaultInputs, "relayed")
    expect(relayedInputs).not.toBeNull()

    const response = computeGraduation({ reqId: 18, inputs: defaultInputs, currentDps })

    expect(response.relayedTheoreticalDps).toBe(dpsFor(relayedInputs!))
    expect(response.relayedTheoreticalDps!).toBeLessThan(response.theoreticalDps!)
    expect(response.graduationRate).toBe(currentDps / response.theoreticalDps!)
  })
})
