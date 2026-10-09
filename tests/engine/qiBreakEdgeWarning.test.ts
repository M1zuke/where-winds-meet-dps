// Damage assertions scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { QI_EDGE_MARGIN_SEC } from "../../src/engine/qiBreakEdge"
import type { EngineRunOptions, Inputs } from "../../src/engine/types"
import { builtinSkill, testRotation } from "../builtins"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"

const CLASS = "bellstrikeUmbra"
const FPS = 60
const BREAK_SEC = 10

function rotationInputs(skillId: string, casts: number, overrides: Partial<Inputs> = {}): Inputs {
  const steps = Array.from({ length: casts }, () =>
    makeStep({ skillId: builtinSkill(CLASS, skillId).id }),
  )
  return {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: testRotation(CLASS, { name: "edge-probe", steps }),
    ...overrides,
  }
}

function breakEndingAt(endFrame: number): EngineRunOptions {
  return {
    fixedQiBreaks: [
      { startSec: endFrame / FPS - BREAK_SEC, durationSec: BREAK_SEC, lowQiLeadSec: 0 },
    ],
  }
}

function firstHitFrame(inputs: Inputs): number {
  const result = simulateTimeline(inputs, { fixedQiBreaks: [] })
  return result.timeline!.find((event) => event.kind === "hit")!.frame
}

describe("Qi break edge warning", () => {
  const doubling = MYSTIC_SKILL.dragonHeadPlus
  const single = rotationInputs(doubling, 1)
  const hitFrame = firstHitFrame(single)
  const damageOf = (options: EngineRunOptions) => simulateTimeline(single, options).totalDamage
  const damageInside = damageOf(breakEndingAt(hitFrame + 600))
  const damageOutside = damageOf({ fixedQiBreaks: [] })

  it("names the edge, the distance and the share for a hit just inside the break end", () => {
    const result = simulateTimeline(single, breakEndingAt(hitFrame + 6))
    expect(result.qiEdgeWarnings).toHaveLength(1)
    const [warning] = result.qiEdgeWarnings!
    expect(warning.skillName).toBe(builtinSkill(CLASS, doubling).name)
    expect(warning.edge).toBe("end")
    expect(warning.side).toBe("before")
    expect(warning.offsetSec).toBeCloseTo(6 / FPS, 9)
    expect(warning.edgeSec).toBeCloseTo((hitFrame + 6) / FPS - result.fightStartSec, 9)
    expect(warning.shareOfTotal).toBeCloseTo((damageInside - damageOutside) / damageInside, 6)
  })

  it("names the edge for a hit just after the break end", () => {
    const result = simulateTimeline(single, breakEndingAt(hitFrame - 6))
    const [warning] = result.qiEdgeWarnings!
    expect(warning.edge).toBe("end")
    expect(warning.side).toBe("after")
    expect(warning.shareOfTotal).toBeCloseTo((damageInside - damageOutside) / damageOutside, 6)
  })

  it("names the start edge for a hit just inside the break start", () => {
    const startFrame = hitFrame - 6
    const result = simulateTimeline(single, {
      fixedQiBreaks: [{ startSec: startFrame / FPS, durationSec: BREAK_SEC, lowQiLeadSec: 0 }],
    })
    const [warning] = result.qiEdgeWarnings!
    expect(warning.edge).toBe("start")
    expect(warning.side).toBe("after")
  })

  it("stays silent when the hit is a full second from the edge", () => {
    expect(simulateTimeline(single, breakEndingAt(hitFrame + FPS)).qiEdgeWarnings).toBeUndefined()
  })

  it("stays silent when only the broken-target bonus differs and it is a small share of the run", () => {
    const longRun = rotationInputs(MYSTIC_SKILL.dragonHead, 40)
    const firstHit = firstHitFrame(longRun)
    const result = simulateTimeline(longRun, breakEndingAt(firstHit + 6))
    const unbroken = simulateTimeline(longRun, { fixedQiBreaks: [] })
    expect(result.totalDamage).toBeGreaterThan(unbroken.totalDamage)
    expect(result.qiEdgeWarnings).toBeUndefined()
  })
})

describe("Qi break edge warning on a DoT", () => {
  const probeSkill = makeSkill(CLASS, {
    name: "Probe Hit",
    castFrames: 21 * FPS,
    hits: Array.from({ length: 21 }, (_, second) =>
      makeHit({ frame: second * FPS, physMultiplier: 0.1 }),
    ),
  })
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    set: null,
    divinecraft: "fire",
    customSkills: [probeSkill],
    activeCustomRotation: testRotation(CLASS, { steps: [makeStep({ skillId: probeSkill.id })] }),
  }

  it("aggregates every tick across one edge into a single warning for the DoT", () => {
    const result = simulateTimeline(inputs, breakEndingAt(11 * FPS))
    const endWarnings = (result.qiEdgeWarnings ?? []).filter(
      (warning) => warning.edge === "end" && warning.skillName === "Divinecraft - Fire",
    )
    expect(endWarnings).toHaveLength(1)
    const ticksWithinMargin = result.timeline!.filter(
      (event) =>
        event.skillName === "Divinecraft - Fire" &&
        Math.abs(event.frame - 11 * FPS) <= QI_EDGE_MARGIN_SEC * FPS,
    )
    expect(ticksWithinMargin.length).toBeGreaterThan(1)
  })
})

describe("Qi break edge re-score is read-only", () => {
  const inputs = rotationInputs(MYSTIC_SKILL.dragonHeadPlus, 3)
  const hitFrame = firstHitFrame(inputs)
  const options = breakEndingAt(hitFrame + 6)

  it("reports the same figures with and without the warning computation", () => {
    const full = simulateTimeline(inputs, options)
    const totals = simulateTimeline(inputs, { ...options, collect: "totals" })
    expect(full.qiEdgeWarnings).toBeDefined()
    expect(totals.qiEdgeWarnings).toBeUndefined()
    expect(full.totalDamage).toBe(totals.totalDamage)
    expect(full.dps).toBe(totals.dps)
    expect(full.qiBreaks).toEqual(totals.qiBreaks)
  })

  it("leaves a seeded run's roll stream untouched", () => {
    const full = simulateTimeline(inputs, { ...options, seed: 7 })
    const totals = simulateTimeline(inputs, { ...options, seed: 7, collect: "totals" })
    expect(full.totalDamage).toBe(totals.totalDamage)
    expect(full.outcomeCounts).toEqual(totals.outcomeCounts)
  })
})
