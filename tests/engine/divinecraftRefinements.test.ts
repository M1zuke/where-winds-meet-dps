import { describe, expect, it } from "vitest"
import {
  appliedRefinement,
  DIVINECRAFT_REFINEMENTS,
  type DivinecraftRefinementId,
} from "../../src/data/consumables/divinecraftRefinements"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill } from "../../src/engine/skill"
import type { Inputs, Result, TimelineEvent } from "../../src/engine/types"

// Scoped to Bellstrike Umbra, a validated class (CLAUDE.md § "Implemented classes").
const CLASS = "bellstrikeUmbra"
const HIT_NAME = "Probe Hit"
const POISON_NAME = "Divinecraft - Poison"
const BURN_NAME = "Divinecraft - Fire"
const HIT_SECONDS = [0, 1, 2]
const ENCHANT_DAMAGE_BOOST = 0.01
const TEMPERED_FIRE_RATIO = (1 + ENCHANT_DAMAGE_BOOST + 0.004) / (1 + ENCHANT_DAMAGE_BOOST)

function run(overrides: Partial<Inputs>): Result {
  const hits = HIT_SECONDS.map((sec) =>
    makeHit({ frame: Math.round(sec * 60), physMultiplier: 0.1, qiRate: 1 }),
  )
  const skill = makeSkill(CLASS, {
    name: HIT_NAME,
    castFrames: hits[hits.length - 1].frame + 60,
    hits,
  })
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    dummyMode: true,
    customSkills: [skill],
    activeCustomRotation: makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] }),
    ...overrides,
  })
}

function damagesNamed(result: Result, name: string): number[] {
  return (result.timeline ?? [])
    .filter((event: TimelineEvent) => event.skillName === name)
    .map((event) => event.damage)
}

function qiTotal(result: Result): number {
  return (result.qiDamageLog ?? []).reduce((sum, entry) => sum + entry.qi, 0)
}

describe("Divinecraft: Water adds only its all-damage bonus", () => {
  const withWater = run({ divinecraft: "water" })
  const withoutEnchant = run({ divinecraft: null })

  it("raises every own hit by exactly 1%", () => {
    const boosted = damagesNamed(withWater, HIT_NAME)
    const plain = damagesNamed(withoutEnchant, HIT_NAME)
    expect(boosted).toHaveLength(HIT_SECONDS.length)
    boosted.forEach((damage, index) => expect(damage / plain[index]).toBeCloseTo(1.01, 9))
  })

  it("adds no damage-over-time row, and its Qi rises only with the boosted hit damage", () => {
    expect(damagesNamed(withWater, POISON_NAME)).toHaveLength(0)
    expect(damagesNamed(withWater, BURN_NAME)).toHaveLength(0)
    const waterQi = (withWater.qiDamageLog ?? []).map((entry) => entry.qi)
    const plainQi = (withoutEnchant.qiDamageLog ?? []).map((entry) => entry.qi)
    waterQi.forEach((qi, index) => expect(qi / plainQi[index]).toBeCloseTo(1.01, 9))
  })
})

describe("Divinecraft refined items", () => {
  const damageOf = (result: Result) => damagesNamed(result, HIT_NAME)

  it.each(["vipersFire", "condensedMalice"] as const)(
    "%s changes nothing for fire or water or no enchant",
    (refinement) => {
      for (const divinecraft of ["fire", "water", null] as const) {
        const plain = run({ divinecraft })
        const refined = run({ divinecraft, divinecraftRefinement: refinement })
        expect(damageOf(refined)).toEqual(damageOf(plain))
        expect(qiTotal(refined)).toBe(qiTotal(plain))
      }
    },
  )

  it.each(["deepPool", "vipersFire"] as const)(
    "%s adds Tempered Fire's 0.4% damage with its own element only",
    (refinement) => {
      const element = DIVINECRAFT_REFINEMENTS.find((entry) => entry.id === refinement)!.element
      const plain = run({ divinecraft: element })
      const refined = run({ divinecraft: element, divinecraftRefinement: refinement })
      damageOf(refined).forEach((damage, index) =>
        expect(damage / damageOf(plain)[index]).toBeCloseTo(TEMPERED_FIRE_RATIO, 9),
      )
    },
  )

  it("Tempered Fire reaches the damage-over-time ticks of its enchant", () => {
    const plain = damagesNamed(run({ divinecraft: "poison" }), POISON_NAME)
    const refined = damagesNamed(
      run({ divinecraft: "poison", divinecraftRefinement: "vipersFire" }),
      POISON_NAME,
    )
    expect(refined.length).toBeGreaterThan(0)
    refined.forEach((damage, index) =>
      expect(damage / plain[index]).toBeCloseTo(TEMPERED_FIRE_RATIO, 9),
    )
  })

  it.each(["cinderAsh", "vastOcean"] as const)(
    "%s adds Heart Poison's 4% Qi damage and no HP damage",
    (refinement) => {
      const element = DIVINECRAFT_REFINEMENTS.find((entry) => entry.id === refinement)!.element
      const plain = run({ divinecraft: element })
      const refined = run({ divinecraft: element, divinecraftRefinement: refinement })
      expect(damageOf(refined)).toEqual(damageOf(plain))
      const plainLog = plain.qiDamageLog ?? []
      const refinedLog = refined.qiDamageLog ?? []
      expect(refinedLog).toHaveLength(plainLog.length)
      refinedLog.forEach((entry, index) =>
        expect(entry.qi / plainLog[index].qi).toBeCloseTo(1.04, 9),
      )
    },
  )

  it("scores nothing when the stored refinement belongs to another element", () => {
    const cases: [DivinecraftRefinementId, Inputs["divinecraft"]][] = [
      ["cinderAsh", "water"],
      ["cinderAsh", "poison"],
      ["cinderAsh", null],
      ["deepPool", "fire"],
      ["deepPool", "poison"],
      ["vipersFire", "water"],
      ["vastOcean", "fire"],
    ]
    for (const [refinement, divinecraft] of cases) {
      const plain = run({ divinecraft })
      const stored = run({ divinecraft, divinecraftRefinement: refinement })
      expect(damageOf(stored)).toEqual(damageOf(plain))
      expect(qiTotal(stored)).toBe(qiTotal(plain))
    }
  })

  it("applies a refinement only for its own element", () => {
    expect(appliedRefinement({ divinecraft: "fire", divinecraftRefinement: "cinderAsh" })?.id).toBe(
      "cinderAsh",
    )
    expect(appliedRefinement({ divinecraft: "water", divinecraftRefinement: "cinderAsh" })).toBe(
      null,
    )
    expect(appliedRefinement({ divinecraft: null, divinecraftRefinement: "cinderAsh" })).toBe(null)
    expect(appliedRefinement({ divinecraft: "fire", divinecraftRefinement: null })).toBe(null)
    expect(
      appliedRefinement({
        divinecraft: "fire",
        divinecraftRefinement: "unknown" as DivinecraftRefinementId,
      }),
    ).toBe(null)
  })
})
