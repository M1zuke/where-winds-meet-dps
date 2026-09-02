// Scoped to bellstrikeUmbra — TESTING.md § "Class scoping".
import { describe, expect, it } from "vitest"
import { CrosswindTracker } from "../../src/engine/buffs/crosswind"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { ZENITH_BAR_BUFF_ID } from "../../src/data/innerWays/swordHorizonZenith"
import type { Inputs } from "../../src/engine/types"

const MAX = 5
const CLASS = "bellstrikeUmbra"

const tracker = (initialCharges?: number) =>
  new CrosswindTracker({ maxCharges: MAX, retainOnMax: false, initialCharges })

describe("CrosswindTracker — opening charges", () => {
  it("opens empty when no opening count is given", () => {
    expect(tracker().charge).toBe(0)
  })

  it("opens on the given count", () => {
    expect(tracker(3).charge).toBe(3)
  })

  it("advances by one per detonation from the opening count, exactly as from empty", () => {
    const opened = tracker(3)
    opened.onDetonation()
    expect(opened.charge).toBe(4)
    opened.onDetonation()
    expect(opened.charge).toBe(5)
  })

  it("reaches its guaranteed-affinity detonation earlier by the opening count", () => {
    const empty = tracker()
    const opened = tracker(3)
    const detonationsUntilAffinity = (subject: CrosswindTracker) => {
      let casts = 0
      while (!subject.onDetonation().guaranteedAffinity) casts++
      return casts
    }
    expect(detonationsUntilAffinity(empty) - detonationsUntilAffinity(opened)).toBe(3)
  })

  it("grants the damage bonus on the very first detonation when it opens charged", () => {
    expect(tracker().onDetonation().damageBonusActive).toBe(false)
    expect(tracker(1).onDetonation().damageBonusActive).toBe(true)
  })

  it("resets to empty after a detonation at max, not back to the opening count", () => {
    const opened = tracker(MAX)
    expect(opened.onDetonation().guaranteedAffinity).toBe(true)
    expect(opened.charge).toBe(0)
  })

  it("clamps an opening count above the cap and below zero", () => {
    expect(tracker(99).charge).toBe(MAX)
    expect(tracker(-2).charge).toBe(0)
  })
})

function zenithStacksPerCast(opening: number): number[] {
  const filler = builtinSkill(CLASS, SKILL.swordq)!
  const detonation = builtinSkill(CLASS, SKILL.bleedDetonation)!
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    mindMethods: [
      { name: "Sword Horizon", id: "swordHorizon", stacks: "tier 6" },
      ...defaultInputs.mindMethods.slice(1),
    ] as Inputs["mindMethods"],
    activeCustomRotation: makeRotation(CLASS, {
      name: "opening-stacks",
      steps: [
        makeStep({ skillId: filler.id, hitCount: filler.hits.length }),
        makeStep({ skillId: detonation.id, hitCount: detonation.hits.length }),
      ],
      openingStacks: { [ZENITH_BAR_BUFF_ID]: opening },
    }),
  }
  return (simulateTimeline(inputs).casts ?? []).map(
    (cast) => cast.buffs.find((buff) => buff.id === ZENITH_BAR_BUFF_ID)?.stacks ?? 0,
  )
}

describe("Zenith Bar opening stacks — the rotation timeline", () => {
  it("shows the opening count on a cast that lands before the first detonation", () => {
    expect(zenithStacksPerCast(3)[0]).toBe(3)
  })

  it("advances from the opening count on the first detonation, rather than from empty", () => {
    expect(zenithStacksPerCast(3)[1]).toBe(4)
    expect(zenithStacksPerCast(0)[1]).toBe(1)
  })

  it("draws the bar empty, not at a single stack, when the rotation opens on nothing", () => {
    expect(zenithStacksPerCast(0)[0]).toBe(0)
  })
})
