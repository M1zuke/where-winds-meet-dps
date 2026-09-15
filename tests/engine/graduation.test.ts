import { describe, expect, it } from "vitest"
import { CLASS_DEFS, classDefinition } from "../../src/definitions/classes/registry"
import { attunementMax, getAttunement } from "../../src/engine/attunements"
import { defaultInputs } from "../../src/engine/defaults"
import { gearBaseStatsFor } from "../../src/data/stats/gearBaseStats"
import { GEAR_WORD_UNIT, gearWordMaxRoll } from "../../src/data/stats/statLines"
import { relayedCapValue } from "../../src/engine/gearStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { runEngine } from "../../src/engine/dps"
import { computeGraduation } from "../../src/engine/dpsWorker"
import {
  graduationBuild,
  graduationInputs,
  withGraduationRotation,
} from "../../src/engine/graduation"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { GEAR_SLOTS, type GearLevel } from "../../src/engine/types"

const GRADUATION_LEVEL: GearLevel = 96

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
    "%s benchmarks one of its own built-in rotations",
    (_classId, classDef) => {
      expect(classDef.rotations.map((rotation) => rotation.id)).toContain(
        classDef.graduationBuild.rotationId,
      )
    },
  )

  it.each(CLASS_DEFS().map((classDef) => [classDef.id, classDef] as const))(
    "%s rolls every graduation word and attunement at the catalogue's max",
    (classId, classDef) => {
      const specs = getWordSpecs({ ...defaultInputs, classId }, GRADUATION_LEVEL)
      for (const piece of classDef.graduationBuild.gear) {
        for (const word of piece.words) {
          const spec = specs.find((candidate) => candidate.word === word.word)
          expect(
            spec,
            `${piece.slot} names ${word.word}, which this class cannot roll`,
          ).toBeDefined()
          expect(word.value).toBe(spec!.amount)
        }
        const attunement = getAttunement(piece.attunement)
        expect(piece.attunementValue).toBe(
          attunement ? attunementMax(attunement, GRADUATION_LEVEL) : undefined,
        )
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
      const relayed = graduationBuild(classId, "relayed", GRADUATION_LEVEL)
      expect(relayed).not.toBeNull()

      for (const piece of relayed!.gear) {
        expect(piece.relayed).toBe(true)
        for (const word of piece.words) {
          if (!word.word) continue
          expect(word.value).toBe(
            relayedCapValue(
              gearWordMaxRoll(word.word, GRADUATION_LEVEL),
              GEAR_WORD_UNIT[word.word],
            ),
          )
        }
        const attunement = getAttunement(piece.attunement)
        expect(piece.attunementValue).toBe(
          attunement ? attunementMax(attunement, GRADUATION_LEVEL) : undefined,
        )
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
      const relayed = graduationBuild(classId, "relayed", GRADUATION_LEVEL)

      expect(relayed!.set).toBe(overrides.set ?? build.set)
      expect(relayed!.bowSet).toBe(overrides.bowSet ?? build.bowSet)
      expect(relayed!.arsenal).toBe(overrides.arsenal ?? build.arsenal)
    },
  )

  it("leaves the max-roll variant untouched by the relayed overrides", () => {
    const build = graduationBuild("bellstrikeUmbra", "maxRolls", GRADUATION_LEVEL)
    expect(build!.gear).toEqual(classDefinition("bellstrikeUmbra")!.graduationBuild.gear)
    expect(build!.bowSet).toBe("crit")
    expect(graduationBuild("bellstrikeUmbra", "relayed", GRADUATION_LEVEL)!.bowSet).toBe("affinity")
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

describe("graduation build follows the current breakthrough's gear level", () => {
  it("BT18 (level 100) rolls every word and attunement at the level-100 ceiling", () => {
    const inputs = { ...defaultInputs, classId: "bellstrikeUmbra", breakthrough: 18 }
    const build = graduationBuild(inputs.classId, "maxRolls", 100)!
    const specs = getWordSpecs(inputs, 100)

    for (const piece of build.gear) {
      expect(piece.level).toBe(100)
      expect(piece).toMatchObject(gearBaseStatsFor(piece))
      for (const word of piece.words) {
        const spec = specs.find((candidate) => candidate.word === word.word)
        expect(spec).toBeDefined()
        expect(word.value).toBe(spec!.amount)
      }
      const attunement = getAttunement(piece.attunement)
      expect(piece.attunementValue).toBe(attunement ? attunementMax(attunement, 100) : undefined)
    }
  })

  it("BT18's benchmark differs from BT17's — the ceilings are not silently shared", () => {
    const bt17Inputs = { ...defaultInputs, classId: "bellstrikeUmbra", breakthrough: 17 }
    const bt18Inputs = { ...defaultInputs, classId: "bellstrikeUmbra", breakthrough: 18 }
    const bt17Benchmark = withDerivedStats(graduationInputs(bt17Inputs)!)
    const bt18Benchmark = withDerivedStats(graduationInputs(bt18Inputs)!)

    expect(bt18Benchmark.phys.max).toBeGreaterThan(bt17Benchmark.phys.max)
  })
})

describe("computeGraduation", () => {
  it("matches the direct benchmark pipeline and current-to-theoretical ratio", () => {
    const currentDps = dpsFor(withGraduationRotation(defaultInputs)!)
    const benchmarkInputs = graduationInputs(defaultInputs)
    expect(benchmarkInputs).not.toBeNull()
    const theoreticalDps = dpsFor(benchmarkInputs!)
    expect(theoreticalDps).toBeGreaterThan(currentDps)

    const response = computeGraduation({ reqId: 17, inputs: defaultInputs })

    expect(response.reqId).toBe(17)
    expect(response.theoreticalDps).toBe(theoreticalDps)
    expect(response.graduationRate).toBe(currentDps / theoreticalDps)
    expect(response.graduationRate).toBeGreaterThan(0)
    expect(response.graduationRate).toBeLessThan(1)
  })

  it("reports the relayed benchmark alongside the max-roll one, and rates against max rolls", () => {
    const currentDps = dpsFor(withGraduationRotation(defaultInputs)!)
    const relayedInputs = graduationInputs(defaultInputs, "relayed")
    expect(relayedInputs).not.toBeNull()

    const response = computeGraduation({ reqId: 18, inputs: defaultInputs })

    expect(response.relayedTheoreticalDps).toBe(dpsFor(relayedInputs!))
    expect(response.relayedTheoreticalDps!).toBeLessThan(response.theoreticalDps!)
    expect(response.graduationRate).toBe(currentDps / response.theoreticalDps!)
  })

  it("rates the build and the benchmark on the graduation rotation, whichever rotation the build has selected", () => {
    const classDef = classDefinition(defaultInputs.classId)!
    const otherRotation = classDef.rotations.find(
      (rotation) => rotation.id !== classDef.graduationBuild.rotationId,
    )!
    const selectingOther = { ...defaultInputs, selectedBuiltinRotationId: otherRotation.id }
    expect(dpsFor(selectingOther)).not.toBe(dpsFor(defaultInputs))

    const onOther = computeGraduation({ reqId: 19, inputs: selectingOther })
    const onGraduation = computeGraduation({ reqId: 19, inputs: defaultInputs })

    expect(onOther).toEqual(onGraduation)
  })
})
