import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — a validated class (CLAUDE.md
// § "Implemented classes").
const CLASS = "bellstrikeUmbra"

function castAll(skills: Skill[], debuffs: Debuff[] = []): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customDebuffs: debuffs,
    activeCustomRotation: makeRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id, hitCount: 1 })),
    }),
    set: null,
  }
}

function ticker(patch: Partial<Debuff>): Debuff {
  return makeDebuff(CLASS, {
    name: "Tick",
    durationFrames: 600,
    dot: {
      tickIntervalFrames: 100,
      physMultiplier: 1,
      physFixed: 0,
      attributeMultiplier: 0,
      attributeFixed: 0,
      attributeAttack: "",
      skillType: "sustain",
      count: 1,
      perStackShapes: null,
    },
    ...patch,
  })
}

function applier(debuffId: string): Skill {
  return makeSkill(CLASS, {
    name: "Applier",
    castFrames: 600,
    hits: [
      makeHit({
        frame: 0,
        physMultiplier: 1,
        physFixed: 100,
        triggers: [makeTrigger({ kind: "applyDot", targetId: debuffId, stacks: 1 })],
      }),
    ],
  })
}

function striker(patch: Partial<Skill>): Skill {
  return makeSkill(CLASS, {
    castFrames: 60,
    hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 })],
    ...patch,
  })
}

describe("breakdown name on a per-skill result row", () => {
  it("reports the authored breakdown name while each row keeps its own skill name", () => {
    const threeHit = striker({ name: "Skill 3-Hit", breakdownName: "In-Game Skill" })
    const fourHit = striker({ name: "Skill 4-Hit", breakdownName: "In-Game Skill" })

    const { perSkill } = simulateTimeline(castAll([threeHit, fourHit]))

    expect(perSkill.map((row) => row.name)).toEqual(["Skill 3-Hit", "Skill 4-Hit"])
    expect(perSkill.map((row) => row.breakdownName)).toEqual(["In-Game Skill", "In-Game Skill"])
  })

  it("falls back to the skill name when no breakdown name is authored", () => {
    const plain = striker({ name: "Unnamed Group" })

    const { perSkill } = simulateTimeline(castAll([plain]))

    expect(perSkill[0].breakdownName).toBe("Unnamed Group")
  })

  it("falls back to the skill name when the authored breakdown name is blank", () => {
    const blank = striker({ name: "Blank Group", breakdownName: "   " })

    const { perSkill } = simulateTimeline(castAll([blank]))

    expect(perSkill[0].breakdownName).toBe("Blank Group")
  })

  it("names a DoT row from its debuff", () => {
    const debuff = ticker({ name: "Tick", breakdownName: "In-Game Skill" })

    const { perSkill } = simulateTimeline(castAll([applier(debuff.id)], [debuff]))
    const dotRow = perSkill.find((row) => row.name.endsWith("(DoT)"))

    expect(dotRow?.name).toBe("Tick (DoT)")
    expect(dotRow?.breakdownName).toBe("In-Game Skill")
  })

  it("marks no DoT row as a DoT — the fallback is the debuff's bare name", () => {
    const debuff = ticker({ name: "Tick" })

    const { perSkill } = simulateTimeline(castAll([applier(debuff.id)], [debuff]))
    const dotRow = perSkill.find((row) => row.name.endsWith("(DoT)"))

    expect(dotRow?.breakdownName).toBe("Tick")
  })

  it("reports a DoT and the skill applying it as one group when both name it the same", () => {
    const debuff = ticker({ name: "Tick", breakdownName: "In-Game Skill" })
    const cast = { ...applier(debuff.id), breakdownName: "In-Game Skill" }

    const { perSkill } = simulateTimeline(castAll([cast], [debuff]))

    expect(perSkill).toHaveLength(2)
    expect(new Set(perSkill.map((row) => row.breakdownName))).toEqual(new Set(["In-Game Skill"]))
  })

  it("ignores the tick's source skill — only the debuff names its DoT row", () => {
    const debuff = ticker({ name: "Tick" })
    const source = makeSkill(CLASS, {
      id: debuff.id.replace(/^debuff-/, ""),
      name: "Source",
      breakdownName: "Source Group",
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 })],
    })

    const { perSkill } = simulateTimeline(castAll([applier(debuff.id), source], [debuff]))
    const dotRow = perSkill.find((row) => row.name.endsWith("(DoT)"))

    expect(dotRow?.breakdownName).toBe("Tick")
  })

  it("leaves damage untouched — a breakdown name is display text only", () => {
    const named = striker({ name: "Grouped", breakdownName: "In-Game Skill" })
    const unnamed = striker({ name: "Grouped" })

    const grouped = simulateTimeline(castAll([named]))
    const control = simulateTimeline(castAll([unnamed]))

    expect(grouped.totalDamage).toBeGreaterThan(0)
    expect(grouped.totalDamage).toBeCloseTo(control.totalDamage, 10)
  })
})
