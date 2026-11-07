import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { graduationBuildAtLevel } from "../../src/engine/graduation"
import { computeGearContribution, relayedCapValue } from "../../src/engine/gearStats"
import type { GearLevel, GearPiece, Inputs } from "../../src/engine/types"
import { gearPieceAtGearLevel } from "../../src/data/classes/graduationGear"
import {
  gearWordPoolInitial,
  gearWordPoolRetune,
  gearWordRelayedToLevel,
} from "../../src/data/stats/gearWordPools"
import { gearWordMaxRoll } from "../../src/data/stats/statLines"
import stBurst from "../../src/data/classes/bellstrike-umbra/graduationBuilds/st-burst"
import { builtinSkill } from "../builtins"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"

const LEGACY_WORDS = ["singleTargetMysticBoost", "areaMysticBoost"]

function totalOf(skillIds: string[], overrides: Partial<Inputs>): number {
  const steps = skillIds.map((skillId) =>
    makeStep({ skillId: builtinSkill("bellstrikeUmbra", skillId).id }),
  )
  const rotation = makeRotation("bellstrikeUmbra", { name: "all-mystic", steps })
  return simulateTimeline({
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    activeCustomRotation: rotation,
    ...overrides,
  }).totalDamage
}

function helmAndArmorOf(gear: readonly GearPiece[]): GearPiece[] {
  return gear.filter((piece) => piece.slot === "helm" || piece.slot === "armor")
}

describe("the helm and chestpiece retune pool", () => {
  it.each([86, 91, 96] as GearLevel[])("rolls the two legacy mystic words at level %i", (level) => {
    for (const slot of ["helm", "armor"] as const) {
      const pool = gearWordPoolRetune(level, slot, null)
      expect(pool).toEqual(expect.arrayContaining(LEGACY_WORDS))
      expect(pool).not.toContain("allMysticBoost")
    }
  })

  it.each([100, 105] as GearLevel[])(
    "adds All Mystic Skill DMG Boost and keeps the two legacy words legal at level %i",
    (level) => {
      for (const slot of ["helm", "armor"] as const) {
        const pool = gearWordPoolRetune(level, slot, null)
        expect(pool).toContain("allMysticBoost")
        expect(pool).toEqual(expect.arrayContaining(LEGACY_WORDS))
      }
    },
  )

  it("never offers All Mystic Skill DMG Boost on the first line or on another slot", () => {
    for (const level of [100, 105] as GearLevel[]) {
      expect(gearWordPoolInitial(level, "helm", null)).not.toContain("allMysticBoost")
      for (const slot of ["disc", "pendant", "greaves", "bracer"] as const) {
        expect(gearWordPoolRetune(level, slot, null)).not.toContain("allMysticBoost")
      }
    }
  })

  it("keeps every other slot's pool at level 100 the same as at 96", () => {
    for (const slot of ["disc", "pendant", "greaves", "bracer"] as const) {
      expect(gearWordPoolRetune(100, slot, null)).toEqual(gearWordPoolRetune(96, slot, null))
    }
  })

  it("rolls All Mystic Skill DMG Boost at the in-game ceilings", () => {
    expect(gearWordMaxRoll("allMysticBoost", 100)).toBe(0.114)
    expect(gearWordMaxRoll("allMysticBoost", 105)).toBe(0.134)
    for (const level of [86, 91, 96] as GearLevel[]) {
      expect(gearWordMaxRoll("allMysticBoost", level)).toBe(0)
    }
  })

  it("converts a legacy word only when a level-96 piece is relayed to 100 or 105", () => {
    expect(gearWordRelayedToLevel("singleTargetMysticBoost", 96, 96)).toBe(
      "singleTargetMysticBoost",
    )
    expect(gearWordRelayedToLevel("singleTargetMysticBoost", 96, 100)).toBe("allMysticBoost")
    expect(gearWordRelayedToLevel("areaMysticBoost", 96, 105)).toBe("allMysticBoost")
    expect(gearWordRelayedToLevel("areaMysticBoost", 100, 100)).toBe("areaMysticBoost")
    expect(gearWordRelayedToLevel("areaMysticBoost", 100, 105)).toBe("areaMysticBoost")
    expect(gearWordRelayedToLevel("singleTargetMysticBoost", 105, 105)).toBe(
      "singleTargetMysticBoost",
    )
    expect(gearWordRelayedToLevel("affinity", 96, 105)).toBe("affinity")
  })
})

describe("a stored level-100 or 105 piece holding a legacy mystic word", () => {
  function helmWithLegacyWord(level: GearLevel): GearPiece {
    const helm = helmAndArmorOf(graduationBuildAtLevel(stBurst, "maxRolls", 96).gear)[0]
    return {
      ...helm,
      level,
      words: helm.words.map((entry) =>
        entry.word === "singleTargetMysticBoost" ? { ...entry, value: 0.1 } : entry,
      ) as GearPiece["words"],
    }
  }

  it.each([100, 105] as GearLevel[])(
    "keeps the legacy word and roll, scoring only its own categories at level %i",
    (level) => {
      const helm = helmWithLegacyWord(level)
      const contribution = computeGearContribution(helm, defaultInputs)
      expect(contribution.find((entry) => entry.path === "singleMysticBoost")?.amount).toBeCloseTo(
        0.1,
      )
      expect(contribution.find((entry) => entry.path === "allMysticBoost")).toBeUndefined()
    },
  )

  it("stays a legacy word when the piece is re-levelled from 100 to 105", () => {
    const releveled = gearPieceAtGearLevel(helmWithLegacyWord(100), 105)
    expect(releveled.words.map((entry) => entry.word)).toContain("singleTargetMysticBoost")
    expect(releveled.words.map((entry) => entry.word)).not.toContain("allMysticBoost")
  })
})

describe("a graduation build carrying a legacy mystic word", () => {
  it("keeps the legacy word at level 96", () => {
    for (const piece of helmAndArmorOf(graduationBuildAtLevel(stBurst, "maxRolls", 96).gear)) {
      expect(piece.words.map((entry) => entry.word)).toContain("singleTargetMysticBoost")
    }
  })

  it.each([100, 105] as GearLevel[])(
    "rolls the merged word at its ceiling at level %i",
    (level) => {
      for (const piece of helmAndArmorOf(graduationBuildAtLevel(stBurst, "maxRolls", level).gear)) {
        const merged = piece.words.filter((entry) => entry.word === "allMysticBoost")
        expect(merged).toHaveLength(1)
        expect(merged[0].value).toBe(gearWordMaxRoll("allMysticBoost", level))
        for (const legacy of LEGACY_WORDS)
          expect(piece.words.map((entry) => entry.word)).not.toContain(legacy)
      }
    },
  )

  it("relays the merged word like any other", () => {
    for (const piece of helmAndArmorOf(graduationBuildAtLevel(stBurst, "relayed", 100).gear)) {
      const merged = piece.words.find((entry) => entry.word === "allMysticBoost")!
      expect(merged.value).toBe(relayedCapValue(gearWordMaxRoll("allMysticBoost", 100), "percent"))
    }
  })

  it("scores the merged word on the allMysticBoost panel stat", () => {
    const helm = helmAndArmorOf(graduationBuildAtLevel(stBurst, "maxRolls", 100).gear)[0]
    const contribution = computeGearContribution(helm, defaultInputs)
    expect(contribution.find((entry) => entry.path === "allMysticBoost")?.amount).toBeCloseTo(
      gearWordMaxRoll("allMysticBoost", 100),
    )
    expect(contribution.find((entry) => entry.path === "singleMysticBoost")).toBeUndefined()
  })
})

describe("All Mystic Skill DMG Boost reaches every mystic category", () => {
  it("raises a single-target rotation exactly as much as the single-target word", () => {
    const skillIds = [MYSTIC_SKILL.fireBreath1Hit, MYSTIC_SKILL.poet1, MYSTIC_SKILL.poet2]
    const base = totalOf(skillIds, {})
    const viaAll = totalOf(skillIds, { allMysticBoost: 0.1 })
    expect(viaAll).toBeGreaterThan(base)
    expect(viaAll).toBeCloseTo(totalOf(skillIds, { singleMysticBoost: 0.1 }))
  })

  it("raises an area rotation exactly as much as the area word", () => {
    const skillIds = [MYSTIC_SKILL.toadCancel, MYSTIC_SKILL.fluteOfTheTidesFull]
    const base = totalOf(skillIds, {})
    const viaAll = totalOf(skillIds, { allMysticBoost: 0.1 })
    expect(viaAll).toBeGreaterThan(base)
    expect(viaAll).toBeCloseTo(totalOf(skillIds, { areaMysticBoost: 0.1 }))
  })

  it("stacks additively with the category's own word", () => {
    const skillIds = [MYSTIC_SKILL.soaring]
    expect(totalOf(skillIds, { singleMysticBoost: 0.05, allMysticBoost: 0.05 })).toBeCloseTo(
      totalOf(skillIds, { singleMysticBoost: 0.1 }),
    )
  })
})
