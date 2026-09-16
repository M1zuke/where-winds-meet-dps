import { describe, expect, it } from "vitest"
import { CLASS_DEFS, classDefinition } from "../../src/definitions/classes/registry"
import type { GraduationBuild } from "../../src/definitions/graduationBuilds/graduationBuildDef"
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
  followedGraduationBuild,
  followedGraduationBuildAmong,
  graduationBuildAtLevel,
  graduationInputs,
  repairGraduationBuildId,
  withGraduationRotation,
} from "../../src/engine/graduation"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { GEAR_SLOTS, type GearLevel } from "../../src/engine/types"

const GRADUATION_LEVEL: GearLevel = 96

const BUILDS = CLASS_DEFS().flatMap((classDef) =>
  classDefinition(classDef.id)!.graduationBuilds.map(
    (build) => [build.id, classDef, build] as const,
  ),
)

function dpsFor(inputs = defaultInputs): number {
  return runEngine(applyBowSet(applyArmorSet(withDerivedStats(inputs)))).dps
}

function fictionalBuild(id: string): GraduationBuild {
  return {
    id,
    name: id,
    classId: "fictionalClass",
    gear: [],
    set: null,
    bowSet: null,
    arsenal: "general",
    rotationId: "fictional-rotation",
  }
}

describe("graduation builds", () => {
  it.each(CLASS_DEFS().map((classDef) => [classDef.id, classDef] as const))(
    "%s ships at least one graduation build",
    (_classId, classDef) => {
      expect(classDefinition(classDef.id)!.graduationBuilds.length).toBeGreaterThan(0)
    },
  )

  it.each(BUILDS)(
    "%s defines one best-in-slot piece for every gear slot",
    (_id, _classDef, build) => {
      expect(build.gear.map((piece) => piece.slot).sort()).toEqual([...GEAR_SLOTS].sort())
      expect(new Set(build.gear.map((piece) => piece.id)).size).toBe(GEAR_SLOTS.length)
      expect(build.gear.every((piece) => piece.words.length === 5)).toBe(true)
    },
  )

  it.each(BUILDS)("%s benchmarks one of its own class's rotations", (_id, classDef, build) => {
    expect(classDef.rotations.map((rotation) => rotation.id)).toContain(build.rotationId)
  })

  it.each(BUILDS)(
    "%s rolls every graduation word and attunement at the catalogue's max",
    (_id, classDef, build) => {
      const specs = getWordSpecs({ ...defaultInputs, classId: classDef.id }, GRADUATION_LEVEL)
      for (const piece of build.gear) {
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

  it.each(BUILDS)(
    "%s equips lv96 legendary base stats straight from the gear table",
    (_id, _classDef, build) => {
      for (const piece of build.gear) {
        expect(piece.level).toBe(96)
        expect(piece.rarity).toBe("legendary")
        expect(piece).toMatchObject(gearBaseStatsFor(piece))
      }
    },
  )

  it.each(BUILDS)(
    "%s relays every graduation word to the shared relayed cap and keeps its attunement at max",
    (_id, _classDef, build) => {
      const relayed = graduationBuildAtLevel(build, "relayed", GRADUATION_LEVEL)

      for (const piece of relayed.gear) {
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
      expect(relayed.gear.map((piece) => piece.id)).toEqual(build.gear.map((piece) => piece.id))
    },
  )

  it.each(BUILDS)(
    "%s takes its relayed set, bow set and arsenal from the relayed overrides",
    (_id, _classDef, build) => {
      const overrides = build.relayedOverrides ?? {}
      const relayed = graduationBuildAtLevel(build, "relayed", GRADUATION_LEVEL)

      expect(relayed.set).toBe(overrides.set ?? build.set)
      expect(relayed.bowSet).toBe(overrides.bowSet ?? build.bowSet)
      expect(relayed.arsenal).toBe(overrides.arsenal ?? build.arsenal)
    },
  )

  it("leaves the max-roll variant untouched by the relayed overrides", () => {
    const followed = followedGraduationBuild(defaultInputs)!
    const build = graduationBuildAtLevel(followed, "maxRolls", GRADUATION_LEVEL)
    expect(build.gear).toEqual(followed.gear)
    expect(build.bowSet).toBe("crit")
    expect(graduationBuildAtLevel(followed, "relayed", GRADUATION_LEVEL).bowSet).toBe("affinity")
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

describe("following a graduation build", () => {
  const first = fictionalBuild("first")
  const second = fictionalBuild("second")

  it("follows the chosen build among several", () => {
    expect(followedGraduationBuildAmong([first, second], "second")).toBe(second)
  })

  it("follows nothing among several until one is chosen", () => {
    expect(followedGraduationBuildAmong([first, second], null)).toBeNull()
    expect(followedGraduationBuildAmong([first, second], "an-unknown-build")).toBeNull()
  })

  it("follows a class's only build without a choice", () => {
    expect(followedGraduationBuildAmong([first], null)).toBe(first)
    expect(followedGraduationBuildAmong([first], "an-unknown-build")).toBe(first)
  })

  it("stores a single-build class's only build when the profile names none", () => {
    const [onlyBuild] = classDefinition("bellstrikeUmbra")!.graduationBuilds
    expect(repairGraduationBuildId("bellstrikeUmbra", undefined)).toBe(onlyBuild.id)
    expect(repairGraduationBuildId("bellstrikeUmbra", "")).toBe(onlyBuild.id)
  })

  it("keeps a stored build id this build does not know", () => {
    expect(repairGraduationBuildId("bellstrikeUmbra", "graduation-from-a-newer-build")).toBe(
      "graduation-from-a-newer-build",
    )
  })

  it("drops another class's build and falls back to this class's only build", () => {
    const [umbraBuild] = classDefinition("bellstrikeUmbra")!.graduationBuilds
    const [otherBuild] = classDefinition("stonesplitStrength")!.graduationBuilds
    expect(repairGraduationBuildId("bellstrikeUmbra", otherBuild.id)).toBe(umbraBuild.id)
  })
})

describe("graduation build follows the current breakthrough's gear level", () => {
  it("BT18 (level 100) rolls every word and attunement at the level-100 ceiling", () => {
    const inputs = { ...defaultInputs, classId: "bellstrikeUmbra", breakthrough: 18 }
    const build = graduationBuildAtLevel(followedGraduationBuild(inputs)!, "maxRolls", 100)
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
    const followed = followedGraduationBuild(defaultInputs)!
    const otherRotation = classDef.rotations.find(
      (rotation) => rotation.id !== followed.rotationId,
    )!
    const selectingOther = { ...defaultInputs, selectedBuiltinRotationId: otherRotation.id }
    expect(dpsFor(selectingOther)).not.toBe(dpsFor(defaultInputs))

    const onOther = computeGraduation({ reqId: 19, inputs: selectingOther })
    const onGraduation = computeGraduation({ reqId: 19, inputs: defaultInputs })

    expect(onOther).toEqual(onGraduation)
  })
})
