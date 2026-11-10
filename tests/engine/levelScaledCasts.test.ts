import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import {
  makeHit,
  makeSkill,
  makeTrigger,
  type CoefficientRow,
  type Skill,
  type SkillHit,
} from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { artLevelRows, mysticTierRows } from "../../src/definitions/skills/levelRowsDef"
import { levelScaled } from "../../src/definitions/skills/skillDef"
import { testRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

const ROWS: Record<number, CoefficientRow> = {
  90: { physMultiplier: 1.1, attributeMultiplier: 1.65, physFixed: 100, attributeFixed: 60 },
  95: { physMultiplier: 1.2, attributeMultiplier: 1.8, physFixed: 150, attributeFixed: 80 },
  100: { physMultiplier: 1.3, attributeMultiplier: 1.95, physFixed: 200, attributeFixed: 100 },
}

function inputsFor(skills: Skill[], breakthrough: number, debuffs: Debuff[] = []): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    breakthrough,
    customSkills: skills,
    customDebuffs: debuffs,
    activeCustomRotation: testRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id })),
    }),
  }
}

function strike(hitPatch: Partial<SkillHit>, id: string): Skill {
  return makeSkill(CLASS, {
    id,
    name: "Probe Strike",
    castFrames: 60,
    guaranteedNormal: true,
    hits: [makeHit({ frame: 0, ...hitPatch })],
  })
}

function damageOf(inputs: Inputs): number {
  return simulateTimeline(inputs).perSkill.reduce((sum, entry) => sum + entry.expectedDamage, 0)
}

describe("a level-scaled hit follows the breakthrough", () => {
  const scaled = strike({ ...levelScaled(artLevelRows(ROWS)) }, "probeClassNotShipped-scaled")

  it.each([
    [13, 90],
    [14, 95],
    [15, 95],
    [16, 100],
    [18, 100],
  ])("at breakthrough %i it deals the art level %i row", (breakthrough, artLevel) => {
    const literal = strike({ ...ROWS[artLevel] }, "probeClassNotShipped-scaled")
    expect(damageOf(inputsFor([scaled], breakthrough))).toBe(
      damageOf(inputsFor([literal], breakthrough)),
    )
  })

  it("deals less at the lower art level than at the higher one", () => {
    const literalTop = strike({ ...ROWS[100] }, "probeClassNotShipped-scaled")
    const literalLow = strike({ ...ROWS[90] }, "probeClassNotShipped-scaled")
    expect(damageOf(inputsFor([literalLow], 13))).toBeLessThan(
      damageOf(inputsFor([literalTop], 13)),
    )
  })

  it("does not flag a step whose breakthrough has a row", () => {
    expect(simulateTimeline(inputsFor([scaled], 13)).invalidStepIds ?? []).toEqual([])
  })
})

describe("a level-scaled hit with no row for the breakthrough", () => {
  const tierRows = mysticTierRows({ 6: ROWS[100] })
  const branchOnly = strike({ ...levelScaled(tierRows) }, "probeClassNotShipped-branch")

  it("flags the step with the lowest breakthrough that has a row", () => {
    const result = simulateTimeline(inputsFor([branchOnly], 13))
    const [stepId] = result.invalidStepIds!
    const [reason] = result.invalidStepReasons![stepId]
    expect(reason).toEqual({
      kind: "breakthrough",
      id: branchOnly.id,
      name: "Probe Strike",
      required: 14,
      actual: 13,
    })
    expect(result.warnings.some((warning) => warning.includes("needs breakthrough 14+"))).toBe(true)
  })

  it("deals the row's own fields while flagged and is not flagged where a row exists", () => {
    const literal = strike({ ...ROWS[100] }, "probeClassNotShipped-branch")
    expect(damageOf(inputsFor([branchOnly], 13))).toBe(damageOf(inputsFor([literal], 13)))
    expect(simulateTimeline(inputsFor([branchOnly], 14)).invalidStepIds ?? []).toEqual([])
  })
})

describe("a level-scaled damage-over-time row", () => {
  const dotRows = mysticTierRows({
    5: { physMultiplier: 0.1, attributeMultiplier: 0, physFixed: 10, attributeFixed: 0 },
    6: { physMultiplier: 0.2, attributeMultiplier: 0, physFixed: 20, attributeFixed: 0 },
  })

  function dotWith(
    row: CoefficientRow & { levelRows?: ReturnType<typeof mysticTierRows> },
  ): Debuff {
    return makeDebuff(CLASS, {
      id: "debuff-probeClassNotShipped-dot",
      name: "Probe Dot",
      durationFrames: 600,
      dot: {
        tickIntervalFrames: 60,
        attributeAttack: "",
        skillType: "weapon",
        weaponOrAttribute: "",
        count: 1,
        perStackShapes: null,
        perStackMultipliers: null,
        ...row,
      },
    })
  }

  const applier = makeSkill(CLASS, {
    id: "probeClassNotShipped-applier",
    name: "Probe Applier",
    castFrames: 600,
    guaranteedNormal: true,
    hits: [
      makeHit({
        frame: 0,
        triggers: [makeTrigger({ kind: "applyDot", targetId: "debuff-probeClassNotShipped-dot" })],
      }),
    ],
  })

  it("ticks with the row of the selected breakthrough", () => {
    const scaled = dotWith(levelScaled(dotRows))
    expect(damageOf(inputsFor([applier], 13, [scaled]))).toBe(
      damageOf(inputsFor([applier], 13, [dotWith(dotRows.rows["5"])])),
    )
    expect(damageOf(inputsFor([applier], 14, [scaled]))).toBe(
      damageOf(inputsFor([applier], 14, [dotWith(dotRows.rows["6"])])),
    )
    expect(damageOf(inputsFor([applier], 13, [scaled]))).toBeLessThan(
      damageOf(inputsFor([applier], 14, [scaled])),
    )
  })
})
