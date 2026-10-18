// Skills, debuffs and the probe mechanics below are placeholder content authored
// only for this file. Hawkwing runs at a roll probability of 1 (a direct
// affinity rate of 1), so its stack count is exact and every scored event it
// listens to shows as one stack on the probe hit that closes each rotation.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { registerMechanic } from "../../src/engine/mechanics"
import { mechanicSubstream } from "../../src/engine/rng"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import { SET_ID } from "../../src/data/sets/ids"
import { withGearSet } from "../helpers/withGearSet"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const PROBE_NAME = "Probe"

const probeSkill = makeSkill(CLASS, {
  name: PROBE_NAME,
  castFrames: 30,
  hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 0 })],
})

function filler(name: string, castFrames = 20, triggers: Skill["hits"][number]["triggers"] = []) {
  return makeSkill(CLASS, {
    name,
    castFrames,
    hits: [makeHit({ frame: 0, physFixed: 1, triggers })],
  })
}

function hawkwingInputs(skills: Skill[], debuffs: Debuff[] = []): Inputs {
  return withGearSet(
    {
      ...defaultInputs,
      classId: CLASS,
      directAffinityRate: 1,
      customSkills: skills,
      customBuffs: [],
      customDebuffs: debuffs,
      activeCustomRotation: testRotation(CLASS, {
        steps: skills.map((skill) => makeStep({ skillId: skill.id })),
      }),
    },
    SET_ID.hawkwing,
    { fabricatePieces: true },
  )
}

function probeDamage(result: ReturnType<typeof simulateTimeline>): number {
  return result.timeline!.find((event) => event.skillName === PROBE_NAME)!.damage
}

function detonationSetup(detonates: boolean) {
  const burst = makeSkill(CLASS, {
    name: "Burst",
    castFrames: 10,
    hits: [makeHit({ frame: 0, physFixed: 1 })],
  })
  const mark = makeDebuff(CLASS, {
    name: "Mark",
    maxStacks: 1,
    durationFrames: 300,
    detonation: detonates ? { skillId: burst.id } : null,
  })
  const detonator = makeSkill(CLASS, {
    name: "Detonator",
    castFrames: 60,
    hits: [
      makeHit({
        frame: 0,
        physFixed: 1,
        triggers: [
          makeTrigger({ kind: "applyDot", targetId: mark.id, stacks: 1 }),
          makeTrigger({ kind: "detonateDot", targetId: mark.id }),
        ],
      }),
    ],
  })
  return { burst, mark, detonator }
}

describe("Hawkwing rolls on every scored damage event", () => {
  it("rolls on a detonation burst as it does on the hit that set it off", () => {
    const damageOf = (detonates: boolean) => {
      const { burst, mark, detonator } = detonationSetup(detonates)
      return probeDamage(simulateTimeline(hawkwingInputs([detonator, burst, probeSkill], [mark])))
    }
    expect(damageOf(true)).toBeGreaterThan(damageOf(false))
  })

  it("rolls on a summoned hit", () => {
    const summoned = filler("Summoned", 10)
    const summoner = filler("Summoner", 20, [
      makeTrigger({ kind: "castSkill", targetId: summoned.id }),
    ])
    const plain = filler("Summoner", 20)
    const withSummon = simulateTimeline(hawkwingInputs([summoner, summoned, probeSkill]))
    const withoutSummon = simulateTimeline(hawkwingInputs([plain, probeSkill]))
    expect(probeDamage(withSummon)).toBeGreaterThan(probeDamage(withoutSummon))
  })

  it("rolls on a DoT tick", () => {
    const pulse = makeDebuff(CLASS, {
      name: "Pulse",
      durationFrames: 300,
      dot: {
        tickIntervalFrames: 30,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const applier = filler("Applier", 100, [
      makeTrigger({ kind: "applyDot", targetId: pulse.id, stacks: 1 }),
    ])
    const plain = filler("Applier", 100)
    const withDot = simulateTimeline(hawkwingInputs([applier, probeSkill], [pulse]))
    const withoutDot = simulateTimeline(hawkwingInputs([plain, probeSkill]))
    expect(probeDamage(withDot)).toBeGreaterThan(probeDamage(withoutDot))
  })

  it("does not roll on a gated tick that never fires", () => {
    const dotCountAndProbe = (gated: boolean) => {
      const pulse = makeDebuff(CLASS, {
        id: "scope-gated-pulse",
        name: "Gated Pulse",
        durationFrames: 100,
        dot: {
          tickIntervalFrames: 30,
          physMultiplier: 0,
          physFixed: 1,
          attributeMultiplier: 0,
          attributeFixed: 0,
          attributeAttack: "",
          skillType: "sustain",
          count: 1,
          ...(gated ? { additionalTicks: { offsetsFrames: [10], requiresBuff: "wineGu" } } : {}),
        },
      })
      const applier = filler("Applier", 100, [
        makeTrigger({ kind: "applyDot", targetId: pulse.id, stacks: 1 }),
      ])
      const result = simulateTimeline(hawkwingInputs([applier, probeSkill], [pulse]))
      return {
        ticks: result.timeline!.filter((event) => event.kind === "dot").length,
        probe: probeDamage(result),
      }
    }
    const gated = dotCountAndProbe(true)
    const plain = dotCountAndProbe(false)
    expect(gated.ticks).toBe(plain.ticks)
    expect(gated.probe).toBe(plain.probe)
  })
})

describe("a mechanic's hooks around one scored event", () => {
  const log: string[] = []
  let chargeBeforeEvent = false
  let chargeAfterEvent = false

  registerMechanic<{ before: boolean; after: boolean }>({
    id: "scopeOrderProbe",
    prepare: (setup) => {
      log.length = 0
      return setup.inputs.customSkills?.some((skill) => skill.id === "scope-order-probe")
        ? { before: false, after: false }
        : null
    },
    beforeEvent: (state, event) => {
      log.push(`before@${Math.round(event.timeSec * 60)}`)
      state.before = chargeBeforeEvent
    },
    contributeAt: (state, frame) => {
      log.push(`score@${frame}`)
      const bonus = (state.before ? 1 : 0) + (state.after ? 2 : 0)
      return bonus > 0 ? { effects: [{ statKey: "allDamageBoost", amount: bonus }] } : null
    },
    observeEvent: (state, event) => {
      log.push(`observe@${Math.round(event.timeSec * 60)}`)
      state.after = chargeAfterEvent
    },
  })

  function runProbe(before: boolean, after: boolean) {
    chargeBeforeEvent = before
    chargeAfterEvent = after
    const skill = makeSkill(CLASS, {
      id: "scope-order-probe",
      name: "Order Probe",
      castFrames: 30,
      hits: [makeHit({ frame: 0, physMultiplier: 1 }), makeHit({ frame: 20, physMultiplier: 1 })],
    })
    const result = simulateTimeline({
      ...defaultInputs,
      classId: CLASS,
      customSkills: [skill],
      customBuffs: [],
      activeCustomRotation: testRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] }),
    })
    return result.timeline!.filter((event) => event.skillName === "Order Probe")
  }

  it("lets an effect applied before an event reach that event's own damage", () => {
    const [first, second] = runProbe(true, false)
    const [plainFirst] = runProbe(false, false)
    expect(first.damage).toBeGreaterThan(plainFirst.damage)
    expect(second.damage).toBeGreaterThan(plainFirst.damage)
    expect(log.indexOf("before@0")).toBeLessThan(log.indexOf("score@0"))
  })

  it("keeps an effect applied after an event off that event and on the ones after it", () => {
    const [first, second] = runProbe(false, true)
    const [plainFirst, plainSecond] = runProbe(false, false)
    expect(first.damage).toBe(plainFirst.damage)
    expect(second.damage).toBeGreaterThan(plainSecond.damage)
  })
})

describe("a mechanic's own extra event", () => {
  let chargeBeforeExtra = false
  let seenBeforeSources: string[] = []

  registerMechanic<{ before: boolean }>({
    id: "scopeExtraProbe",
    prepare: (setup) => {
      seenBeforeSources = []
      return setup.inputs.customSkills?.some((skill) => skill.id === "scope-extra-probe")
        ? { before: false }
        : null
    },
    start: (_state, host) => {
      host.scheduleExtra({
        frame: 20,
        skill: makeSkill(CLASS, { id: "scope-extra-probe-extra", name: "Extra Probe" }),
        art: { name: "Extra Probe", physMultiplier: 1, attributeMultiplier: 1 },
        name: "Extra Probe",
        type: "mindMethod",
        direct: true,
      })
    },
    beforeEvent: (state, event) => {
      seenBeforeSources.push(event.source)
      if (event.source === "extra") state.before = chargeBeforeExtra
    },
    contributeAt: (state) =>
      state.before ? { effects: [{ statKey: "allDamageBoost", amount: 1 }] } : null,
  })

  function extraDamage(charge: boolean): number {
    chargeBeforeExtra = charge
    const opener = makeSkill(CLASS, {
      id: "scope-extra-probe",
      name: "Extra Probe Opener",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1 }), makeHit({ frame: 40, physMultiplier: 1 })],
    })
    const result = simulateTimeline({
      ...defaultInputs,
      classId: CLASS,
      customSkills: [opener],
      customBuffs: [],
      activeCustomRotation: testRotation(CLASS, { steps: [makeStep({ skillId: opener.id })] }),
    })
    return result.timeline!.find((event) => event.skillName === "Extra Probe")!.damage
  }

  it("gets the before-event hook, so an effect set there reaches its own damage", () => {
    const charged = extraDamage(true)
    expect(seenBeforeSources).toContain("extra")
    expect(charged).toBeGreaterThan(extraDamage(false))
  })
})

describe("Bitter Season rolls on direct hits only", () => {
  const bitterInputs = (skills: Skill[], debuffs: Debuff[] = []): Inputs => ({
    ...defaultInputs,
    classId: CLASS,
    mindMethods: [
      { name: "Bitter Season", stacks: "tier 1" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
    ],
    customSkills: skills,
    customBuffs: [],
    customDebuffs: debuffs,
    activeCustomRotation: testRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id })),
    }),
  })

  it("rolls on a detonation burst", () => {
    const damageOf = (detonates: boolean) => {
      const { burst, mark, detonator } = detonationSetup(detonates)
      return probeDamage(simulateTimeline(bitterInputs([detonator, burst, probeSkill], [mark])))
    }
    expect(damageOf(true)).toBeGreaterThan(damageOf(false))
  })

  it("never rolls on a DoT tick", () => {
    const pulse = makeDebuff(CLASS, {
      name: "Pulse",
      durationFrames: 300,
      dot: {
        tickIntervalFrames: 30,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const applier = filler("Applier", 100, [
      makeTrigger({ kind: "applyDot", targetId: pulse.id, stacks: 1 }),
    ])
    const plain = filler("Applier", 100)
    const withDot = simulateTimeline(bitterInputs([applier, probeSkill], [pulse]))
    const withoutDot = simulateTimeline(bitterInputs([plain, probeSkill]))
    expect(withDot.timeline!.some((event) => event.kind === "dot")).toBe(true)
    expect(probeDamage(withDot)).toBe(probeDamage(withoutDot))
  })
})

describe("Divinecraft: Fire counts every scored hit", () => {
  it("counts a detonation burst toward the stacks that ignite an explosion", () => {
    const { burst, mark, detonator } = detonationSetup(true)
    const hits = ["One", "Two", "Three", "Four", "Five"].map((name) => filler(name))
    const [one, two, three, four, five] = hits
    const inputs = {
      ...defaultInputs,
      classId: CLASS,
      divinecraft: "fire" as const,
      customSkills: [detonator, burst, one, two, three, four, five],
      customBuffs: [],
      customDebuffs: [mark],
      activeCustomRotation: testRotation(CLASS, {
        steps: [detonator, one, two, three, four, five].map((skill) =>
          makeStep({ skillId: skill.id }),
        ),
      }),
    }
    const result = simulateTimeline(inputs)
    const explosions = result.perSkill.find((row) => row.name === "Divinecraft - Fire Explosion")
    expect(explosions?.count).toBe(1)
  })

  it("counts a direct-hit DoT tick toward the stacks that ignite an explosion, and a plain tick not", () => {
    const explosionsWith = (directHit: boolean) => {
      const pulse = makeDebuff(CLASS, {
        name: "Pulse",
        durationFrames: 300,
        dot: {
          tickIntervalFrames: 30,
          physMultiplier: 0,
          physFixed: 1,
          attributeMultiplier: 0,
          attributeFixed: 0,
          attributeAttack: "",
          skillType: "sustain",
          count: 1,
          directHit,
        },
      })
      const applier = makeSkill(CLASS, {
        name: "Applier",
        castFrames: 330,
        hits: [
          makeHit({
            frame: 0,
            physFixed: 1,
            triggers: [makeTrigger({ kind: "applyDot", targetId: pulse.id, stacks: 1 })],
          }),
          makeHit({ frame: 320, physFixed: 1 }),
        ],
      })
      const result = simulateTimeline({
        ...defaultInputs,
        classId: CLASS,
        divinecraft: "fire",
        customSkills: [applier],
        customBuffs: [],
        customDebuffs: [pulse],
        activeCustomRotation: testRotation(CLASS, {
          steps: [makeStep({ skillId: applier.id })],
        }),
      })
      return result.perSkill.find((row) => row.name === "Divinecraft - Fire Explosion")?.count ?? 0
    }
    expect(explosionsWith(true)).toBeGreaterThan(0)
    expect(explosionsWith(false)).toBe(0)
  })
})

describe("each mechanic draws from its own substream of a seeded run", () => {
  const firstDraws = new Map<string, number | undefined>()
  for (const id of ["scopeStreamProbeA", "scopeStreamProbeB"])
    registerMechanic<object>({
      id,
      prepare: (setup) => {
        firstDraws.set(id, setup.rng?.())
        return null
      },
    })

  const rotationInputs = (): Inputs => ({
    ...defaultInputs,
    classId: CLASS,
    customSkills: [filler("Only")],
    customBuffs: [],
    activeCustomRotation: testRotation(CLASS, {
      steps: [makeStep({ skillId: filler("Only").id })],
    }),
  })

  it("hands a seeded run the substream derived from its seed and the mechanic's id", () => {
    simulateTimeline(rotationInputs(), { seed: 11 })
    expect(firstDraws.get("scopeStreamProbeA")).toBe(mechanicSubstream(11, "scopeStreamProbeA")())
    expect(firstDraws.get("scopeStreamProbeB")).toBe(mechanicSubstream(11, "scopeStreamProbeB")())
    expect(firstDraws.get("scopeStreamProbeA")).not.toBe(firstDraws.get("scopeStreamProbeB"))
  })

  it("hands an unseeded run no generator", () => {
    simulateTimeline(rotationInputs())
    expect(firstDraws.get("scopeStreamProbeA")).toBeUndefined()
  })
})
