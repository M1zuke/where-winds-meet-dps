// A mechanic that observes the run (docs/CALCULATION.md § "Mechanic rules"):
// every scored damage event reaches it once, in processing order, with the
// affinity chance the event had without the mechanic's own contribution.
import { describe, expect, it } from "vitest"
import { registerMechanic, type MechanicObservedEvent } from "../../src/engine/mechanics"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import { DEBUFF } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"
const FPS = 60

let observedEvents: MechanicObservedEvent[] = []
let callLog: string[] = []
let probeAddsDirectAffinity = false

registerMechanic<object>({
  id: "observationProbe",
  prepare: (setup) => {
    observedEvents = []
    callLog = []
    return setup.hasBuffEngine ? {} : null
  },
  contributeAt: (_state, frame) => {
    callLog.push(`contribute@${frame}`)
    return probeAddsDirectAffinity
      ? { effects: [{ statKey: "directAffinityRate", amount: 0.2 }] }
      : null
  },
  observeEvent: (_state, event) => {
    callLog.push(`observe@${Math.round(event.timeSec * FPS)}`)
    observedEvents.push(event)
  },
})

const damagingHit = (frame: number, patch: Partial<Skill["hits"][number]> = {}) =>
  makeHit({ frame, physMultiplier: 1, physFixed: 100, ...patch })

const carrier = makeSkill(CLASS, {
  name: "Carrier",
  castFrames: 10,
  hits: [makeHit({ frame: 0, triggers: [] })],
})
const fixedDamage = makeSkill(CLASS, {
  name: "Fixed Damage",
  castFrames: 10,
  guaranteedNormal: true,
  hits: [damagingHit(0)],
})
const twin = makeSkill(CLASS, {
  name: "Twin",
  castFrames: 60,
  hits: [damagingHit(0), damagingHit(0)],
})
const applier = makeSkill(CLASS, {
  name: "Applier",
  castFrames: 400,
  hits: [
    damagingHit(0, {
      triggers: [makeTrigger({ kind: "applyDot", targetId: DEBUFF.bleedTick, stacks: 1 })],
    }),
  ],
})

const closer = makeSkill(CLASS, {
  name: "Closer",
  castFrames: 10,
  hits: [damagingHit(0)],
})

function run(options?: { seed: number }) {
  const skills = [carrier, fixedDamage, twin, applier, closer]
  return simulateTimeline(
    {
      ...defaultInputs,
      classId: CLASS,
      customSkills: skills,
      customBuffs: [],
      activeCustomRotation: testRotation(CLASS, {
        steps: skills.map((skill) => makeStep({ skillId: skill.id })),
      }),
    },
    options,
  )
}

describe("an observing mechanic", () => {
  it("receives every damaging hit and every tick once, in order, and nothing for a hit without damage", () => {
    probeAddsDirectAffinity = false
    const result = run()
    const dots = result.timeline?.filter((event) => event.kind === "dot").length ?? 0
    expect(dots).toBeGreaterThan(0)
    expect(observedEvents).toHaveLength((result.timeline?.length ?? 0) - 1)
    const times = observedEvents.map((event) => event.timeSec)
    expect(times).toEqual([...times].sort((left, right) => left - right))
    const frames = observedEvents.map((event) => Math.round(event.timeSec * FPS))
    expect(frames.slice(0, 3)).toEqual([10, 20, 20])
    expect(frames).toContain(80)
  })

  it("lets the second hit on a frame read what the first one left", () => {
    probeAddsDirectAffinity = false
    run()
    const firstObserve = callLog.indexOf("observe@20")
    const secondContribute = callLog.indexOf("contribute@20", firstObserve)
    expect(secondContribute).toBeGreaterThan(firstObserve)
    expect(callLog.indexOf("observe@20", firstObserve + 1)).toBeGreaterThan(secondContribute)
  })

  it("reports the chance a hit had without the mechanic's own contribution", () => {
    probeAddsDirectAffinity = false
    const without = run()
    const chancesWithout = observedEvents.map((event) => event.affinityChance)
    probeAddsDirectAffinity = true
    const withContribution = run()
    expect(observedEvents.map((event) => event.affinityChance)).toEqual(chancesWithout)
    expect(withContribution.totalDamage).toBeGreaterThan(without.totalDamage)
  })

  it("reports no chance for a hit that can never roll an affinity", () => {
    probeAddsDirectAffinity = false
    run()
    expect(observedEvents[0]!.affinityChance).toBe(0)
    expect(observedEvents[1]!.affinityChance).toBeGreaterThan(0)
  })

  it("hands over the outcome each event rolled on a run that rolls hits", () => {
    probeAddsDirectAffinity = false
    const result = run({ seed: 3 })
    expect(observedEvents.length).toBeGreaterThan(0)
    for (const event of observedEvents) expect(typeof event.rolledAffinity).toBe("boolean")
    const affinities = observedEvents.filter((event) => event.rolledAffinity).length
    expect(affinities).toBe(result.outcomeCounts?.affinity ?? -1)
  })
})
