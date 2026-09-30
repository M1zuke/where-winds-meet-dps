import { describe, expect, it, vi } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { defaultCombatSettings, type Inputs } from "../../src/engine/types"
import { buildReadsTargetDistance } from "../../src/engine/buffs/catalog"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"

const { alwaysActiveClassId, alwaysActiveDistanceModule } = vi.hoisted(() => {
  const alwaysActiveClassId = "target-distance-test-always-active-class"
  const alwaysActiveDistanceModule = {
    id: "target-distance-test-always-active-module",
    name: "Always Active Distance Reader",
    alwaysActive: true,
    readsTargetDistance: true,
    affectsAll: true,
    duration: 9999,
    effects: [],
  }
  return { alwaysActiveClassId, alwaysActiveDistanceModule }
})

vi.mock("../../src/definitions/classes/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/definitions/classes/registry")>()
  return {
    ...actual,
    classDefinition: (classId: string) =>
      classId === alwaysActiveClassId
        ? {
            classBuffDefs: [alwaysActiveDistanceModule],
            skills: [],
            debuffs: [],
            mechanics: [],
            allowedMindMethods: [],
          }
        : actual.classDefinition(classId),
  }
})

const CLASS = "bellstrikeUmbra"
// The registered class default for bellstrikeUmbra — see
// src/data/classes/bellstrike-umbra/index.ts.
const CLASS_DEFAULT_MELEE_REACH_METERS = 3

function step(patch: Partial<Skill>): Skill {
  return makeSkill(CLASS, { castFrames: 30, hits: [makeHit({ frame: 0 })], ...patch })
}

function distancesFor(steps: readonly Skill[], preferredDistanceMeters: number): number[] {
  const rotation = makeRotation(CLASS, {
    steps: steps.map((skill) => makeStep({ skillId: skill.id })),
  })
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    customSkills: [...steps],
    activeCustomRotation: rotation,
    combatSettings: { ...defaultCombatSettings(), preferredDistanceMeters },
  }
  return (simulateTimeline(inputs).casts ?? []).map((cast) => cast.distanceMeters)
}

describe("target distance — cast start", () => {
  it("sets the distance to the skill's own reach when it is below the preferred distance", () => {
    const skill = step({ name: "Reach4", reachMeters: 4, approach: "approach" })
    expect(distancesFor([skill], 10)).toEqual([4])
  })

  it("sets the distance to the preferred distance when the skill's own reach exceeds it", () => {
    const skill = step({ name: "Reach10", reachMeters: 10, approach: "approach" })
    expect(distancesFor([skill], 2)).toEqual([2])
  })
})

describe("target distance — no authored reach", () => {
  it("falls back to the class's default melee reach", () => {
    const skill = step({ name: "AssumedMelee", approach: "approach" })
    expect(distancesFor([skill], 10)).toEqual([CLASS_DEFAULT_MELEE_REACH_METERS])
  })
})

describe("target distance — a stationary skill", () => {
  it("keeps the current distance when its own range is wider", () => {
    const near = step({ name: "Near", reachMeters: 6, approach: "approach" })
    const stationary = step({ name: "Stationary", reachMeters: 20, approach: "stationary" })
    expect(distancesFor([near, stationary], 10)).toEqual([6, 6])
  })

  it("caps the current distance at its own range when it is narrower", () => {
    const near = step({ name: "Near", reachMeters: 6, approach: "approach" })
    const stationary = step({ name: "Stationary", reachMeters: 3, approach: "stationary" })
    expect(distancesFor([near, stationary], 10)).toEqual([6, 3])
  })
})

describe("target distance — displacement kinds", () => {
  it("towardTarget shrinks by the reference amount, floored at zero", () => {
    const shrink = step({
      name: "Shrink",
      reachMeters: 8,
      approach: "approach",
      displacement: { kind: "towardTarget", referenceMeters: 3 },
    })
    expect(distancesFor([shrink], 10)).toEqual([5])

    const overshrink = step({
      name: "Overshrink",
      reachMeters: 8,
      approach: "approach",
      displacement: { kind: "towardTarget", referenceMeters: 20 },
    })
    expect(distancesFor([overshrink], 10)).toEqual([0])
  })

  it("toTarget snaps to a fixed distance regardless of reach or the current distance", () => {
    const snap = step({
      name: "Snap",
      reachMeters: 8,
      approach: "approach",
      displacement: { kind: "toTarget", meters: 1.5 },
    })
    expect(distancesFor([snap], 10)).toEqual([1.5])
  })

  it("selfForward is a fixed dash, the result the magnitude of the difference", () => {
    const dashPast = step({
      name: "DashPast",
      reachMeters: 4,
      approach: "approach",
      displacement: { kind: "selfForward", meters: 6 },
    })
    expect(distancesFor([dashPast], 10)).toEqual([2])

    const dashShort = step({
      name: "DashShort",
      reachMeters: 4,
      approach: "approach",
      displacement: { kind: "selfForward", meters: 1 },
    })
    expect(distancesFor([dashShort], 10)).toEqual([3])
  })
})

describe("target distance — byDistance bands", () => {
  it("picks the band the live distance (post-approach) falls in", () => {
    const banded = step({
      name: "Banded",
      reachMeters: 5,
      approach: "approach",
      displacement: {
        kind: "byDistance",
        bands: [
          { minMeters: 0, maxMeters: 5, then: { kind: "toTarget", meters: 1 } },
          { minMeters: 5.01, maxMeters: 100, then: { kind: "toTarget", meters: 9 } },
        ],
        otherwise: { kind: "toTarget", meters: 99 },
      },
    })
    expect(distancesFor([banded], 10)).toEqual([1])
  })

  it("falls back to otherwise when no band's range covers the live distance", () => {
    const unmatched = step({
      name: "Unmatched",
      reachMeters: 5,
      approach: "approach",
      displacement: {
        kind: "byDistance",
        bands: [{ minMeters: 6, maxMeters: 100, then: { kind: "toTarget", meters: 1 } }],
        otherwise: { kind: "toTarget", meters: 42 },
      },
    })
    expect(distancesFor([unmatched], 10)).toEqual([42])
  })
})

describe("target distance — visibility rule", () => {
  it("shows the field only while the rotation carries a skill that grants a distance-reading buff", () => {
    const withoutFlute = makeRotation(CLASS, { steps: [] })
    const withFlute = makeRotation(CLASS, {
      steps: [makeStep({ skillId: MYSTIC_SKILL.fluteOfTheTidesFull })],
    })

    const base: Inputs = { ...defaultInputs, classId: CLASS }
    expect(buildReadsTargetDistance({ ...base, activeCustomRotation: withoutFlute })).toBe(false)
    expect(buildReadsTargetDistance({ ...base, activeCustomRotation: withFlute })).toBe(true)
  })

  it("stays off with no active rotation at all", () => {
    expect(buildReadsTargetDistance({ ...defaultInputs, activeCustomRotation: null })).toBe(false)
  })

  it("shows the field for an always-active module, with no rotation step granting it", () => {
    const rotation = makeRotation(alwaysActiveClassId, { steps: [] })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: alwaysActiveClassId,
      activeCustomRotation: rotation,
    }
    expect(buildReadsTargetDistance(inputs)).toBe(true)
  })
})

describe("target distance — a DoT tick reads the live distance, not the cast that applied it", () => {
  it("Flute of the Tides' ripple bonus varies per tick inside one window, as the caster's own distance changes between ticks", () => {
    // Pushes the cursor from the flute cast's own end (frame 198) to just
    // past the ripple's second tick (frame 378), without moving the target
    // distance itself (reach 2 m, same as the distance-changer leaves it at
    // by the time this filler's own approach runs).
    const filler = step({
      name: "Filler",
      castFrames: 300,
      reachMeters: 2,
      approach: "approach",
    })
    // Snaps the distance to 8 m at frame 498 — strictly between the ripple's
    // second tick (378) and third tick (528).
    const distanceChanger = step({
      name: "DistanceChanger",
      castFrames: 10,
      displacement: { kind: "toTarget", meters: 8 },
    })
    const rotation = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: MYSTIC_SKILL.fluteOfTheTidesFull }),
        makeStep({ skillId: filler.id }),
        makeStep({ skillId: distanceChanger.id }),
      ],
      // Long enough that the ripple's own last tick (frame 828) still lands
      // inside the run, past the last laid cast's own end.
      fixedWindowSec: 15,
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      // Hawkwing's own proc schedule now ramps from the fight's true start
      // rather than always from 0, so its expected bonus drifts smoothly
      // between ticks at the same distance — set aside here so distance
      // alone drives the comparison below.
      set: null,
      customSkills: [filler, distanceChanger],
      activeCustomRotation: rotation,
      combatSettings: { ...defaultCombatSettings(), preferredDistanceMeters: 10 },
    }
    const result = simulateTimeline(inputs)
    const rippleTicks = (result.timeline ?? [])
      .filter((event) => event.kind === "dot" && event.skillName === "Flute Ripple (DoT)")
      .sort((a, b) => a.frame - b.frame)

    expect(rippleTicks.map((tick) => tick.frame)).toEqual([228, 378, 528, 678, 828])
    const [tick1, tick2, tick3, tick4, tick5] = rippleTicks

    // Ticks before the distance-changer's own cast (2 m live distance) land
    // one damage value; ticks after it (8 m) land a different, larger one —
    // one buff window, two distinct per-hit bonuses.
    expect(tick1.damage).toBeCloseTo(tick2.damage, 6)
    expect(tick3.damage).toBeCloseTo(tick4.damage, 6)
    expect(tick3.damage).toBeGreaterThan(tick2.damage)
    // The 5th tick sits close enough to an unrelated periodic mechanic's own
    // boundary that its exact value is not this test's concern — only that
    // it still reads the same 8 m distance band as the two ticks before it.
    expect(tick5.damage).toBeGreaterThan(tick2.damage)
  })
})
