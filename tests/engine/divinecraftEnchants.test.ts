import { describe, expect, it } from "vitest"
import {
  fireOilBurnMechanic,
  toxicPowderPoisonedMechanic,
} from "../../src/data/consumables/divinecraftMechanics"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill } from "../../src/engine/skill"
import type { MechanicSetup } from "../../src/engine/mechanics/types"
import { driveMechanic } from "../helpers/driveMechanic"
import type { Inputs, TimelineEvent } from "../../src/engine/types"
import { testRotation as makeRotation } from "../builtins"

const CLASS = "bellstrikeUmbra"
const POISON_NAME = "Divinecraft - Poison"
const EXPLOSION_NAME = "Divinecraft - Fire Explosion"
const FPS = 60

function consecutiveSeconds(first: number, last: number): number[] {
  return Array.from({ length: last - first + 1 }, (_, index) => first + index)
}

function setupFor(divinecraft: Inputs["divinecraft"]): MechanicSetup {
  return {
    inputs: { divinecraft } as MechanicSetup["inputs"],
    classId: CLASS,
    fps: FPS,
    qiPhaseAt: () => "normal",
    paramOn: () => false,
    paramTier: () => 0,
    hasBuffEngine: false,
    effectiveRates: { precision: 1, critRate: 1, affinityRate: 1 },
    collectHistory: false,
  }
}

function poisonEvents(hitTimesSec: readonly number[], windowEndSec = 60) {
  return driveMechanic(toxicPowderPoisonedMechanic(), setupFor("poison"), {
    hitTimesSec,
    windowEndSec,
  })
}

function fireEvents(hitTimesSec: readonly number[], windowEndSec = 60) {
  return driveMechanic(fireOilBurnMechanic(), setupFor("fire"), { hitTimesSec, windowEndSec })
}

function eventsNamed(timeline: TimelineEvent[] | undefined, name: string): TimelineEvent[] {
  return (timeline ?? []).filter((event) => event.skillName === name)
}

function probeInputs(
  hitSeconds: readonly number[],
  overrides: Partial<Inputs> = {},
  fixedWindowSec?: number,
): Inputs {
  const hits = hitSeconds.map((sec) =>
    makeHit({ frame: Math.round(sec * FPS), physMultiplier: 0.1 }),
  )
  const skill = makeSkill(CLASS, {
    name: "Probe Hit",
    castFrames: hits[hits.length - 1].frame + FPS,
    hits,
  })
  return {
    ...defaultInputs,
    classId: CLASS,
    divinecraft: "poison",
    customSkills: [skill],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: skill.id })],
      fixedWindowSec,
    }),
    ...overrides,
  }
}

describe("Divinecraft: Poison — Poisoned ticks only with the poison enchant selected", () => {
  it.each(["fire", null] as const)("produces no ticks for divinecraft %s", (element) => {
    const result = runEngine(probeInputs([0, 1, 2], { divinecraft: element }))
    expect(eventsNamed(result.timeline, POISON_NAME)).toHaveLength(0)
  })

  it("produces ticks when poison is selected", () => {
    const result = runEngine(probeInputs([0, 1, 2]))
    expect(eventsNamed(result.timeline, POISON_NAME).length).toBeGreaterThan(0)
  })
})

describe("Divinecraft: Poison — Poisoned window", () => {
  const ticksFor = (hitTimesSec: number[], rotationDurationSec: number) =>
    poisonEvents(hitTimesSec, rotationDurationSec).map((event) => event.frame / FPS)

  it("a single hit opens an 8 s window ticking every second from 0.5 s", () => {
    expect(ticksFor([0], 60)).toEqual([0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5])
  })

  it("a later direct hit refreshes the window to 8 s and keeps the tick grid", () => {
    expect(ticksFor([0, 3], 60)).toEqual([0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5])
  })

  it("a gap longer than 8 s closes the window and the next hit restarts the grid", () => {
    expect(ticksFor([0, 10], 60)).toEqual([
      0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5,
    ])
  })

  it("never ticks past the end of the fight window", () => {
    expect(ticksFor([0], 3)).toEqual([0.5, 1.5, 2.5])
  })
})

describe("Divinecraft: Poison — the Poisoned row", () => {
  const events = poisonEvents([0])

  it("is a fixed 0.16 weapon-attack row without an attribute track, flat terms, crit or affinity", () => {
    expect(events.length).toBeGreaterThan(0)
    for (const event of events) {
      expect(event.art).toMatchObject({
        physMultiplier: 0.16,
        attributeMultiplier: 0,
        physFixed: 0,
        attributeFixed: 0,
        guaranteedNormal: 1,
      })
      expect(event.name).toBe(POISON_NAME)
    }
  })

  it("deals Qi at rate 1 plus a flat 1 as a damage-over-time tick", () => {
    for (const event of events) {
      expect(event.qiRate).toBe(1)
      expect(event.qiFlat).toBe(1)
      expect(event.qiHitKind).toBe("dot")
    }
  })

  it("is unaffected by crit- and affinity-damage boosts", () => {
    const low = runEngine(probeInputs([0, 1, 2], { critDamageBoost: 0, affinityDamageBoost: 0 }))
    const high = runEngine(probeInputs([0, 1, 2], { critDamageBoost: 2, affinityDamageBoost: 2 }))
    const lowTicks = eventsNamed(low.timeline, POISON_NAME)
    expect(lowTicks.length).toBeGreaterThan(0)
    expect(eventsNamed(high.timeline, POISON_NAME).map((tick) => tick.damage)).toEqual(
      lowTicks.map((tick) => tick.damage),
    )
  })
})

describe("Divinecraft: Poison — enchant bonuses", () => {
  it("adds 5% Qi damage on every event while poison is selected, and nothing for fire", () => {
    const mechanic = toxicPowderPoisonedMechanic()
    const setup = setupFor("poison")
    const contribution = mechanic.contributeAt?.(mechanic.prepare(setup)!, 0, undefined, setup)
    expect(contribution?.effects).toEqual([{ statKey: "qiDamageBoost", amount: 0.05 }])
    expect(fireOilBurnMechanic().contributeAt).toBeUndefined()
  })

  it("adds 1% HP damage for the whole fight", () => {
    const hitSecond = 90
    const withPoison = runEngine(probeInputs([hitSecond], { dummyMode: true }))
    const withoutEnchant = runEngine(
      probeInputs([hitSecond], { dummyMode: true, divinecraft: null }),
    )
    const hitDamage = (timeline: TimelineEvent[] | undefined) =>
      eventsNamed(timeline, "Probe Hit")[0].damage
    expect(hitDamage(withPoison.timeline) / hitDamage(withoutEnchant.timeline)).toBeCloseTo(1.01, 9)
  })
})

describe("Divinecraft: Fire — Solid Foundation", () => {
  const EXPLOSION_DELAY_FRAMES = 3
  const explosionFramesFor = (hitTimesSec: number[], windowEndSec = 60) =>
    fireEvents(hitTimesSec, windowEndSec)
      .filter((event) => event.name === EXPLOSION_NAME)
      .map((event) => event.frame)
  const framesAfter = (hitSec: number) => hitSec * FPS + EXPLOSION_DELAY_FRAMES

  it("the next direct hit after the fifth stack explodes", () => {
    expect(explosionFramesFor(consecutiveSeconds(0, 5))).toEqual([framesAfter(5)])
  })

  it("the hit that grants Combustion does not explode", () => {
    expect(explosionFramesFor(consecutiveSeconds(0, 4))).toEqual([])
  })

  it("four stacks and a sixth hit never reach Combustion", () => {
    expect(explosionFramesFor([0, 1, 2, 3])).toEqual([])
  })

  it("Combustion that expires without a direct hit produces no explosion", () => {
    expect(explosionFramesFor([0, 1, 2, 3, 4, 10])).toEqual([])
  })

  it("stacks refresh on each new stack and lapse after 5 s without one", () => {
    expect(explosionFramesFor([0, 1, 2, 3, 9, 10, 11])).toEqual([])
    expect(explosionFramesFor([0, 1.5, 3, 4.5, 6, 7])).toEqual([framesAfter(7)])
  })

  it("lands the explosion 3 frames after the hit that triggers it", () => {
    expect(explosionFramesFor(consecutiveSeconds(0, 5))[0] - 5 * FPS).toBe(3)
  })

  it("explodes once per 10 s, on the first hit after the lockout", () => {
    const everyHalfSecond = Array.from({ length: 80 }, (_, index) => index / 2)
    expect(explosionFramesFor(everyHalfSecond)).toEqual([
      framesAfter(2.5),
      framesAfter(12.5),
      framesAfter(22.5),
      framesAfter(32.5),
    ])
  })

  it("keeps Combustion up through an explosion, so the first hit after the lockout fires", () => {
    expect(explosionFramesFor([0, 1, 2, 3, 4, 5, 9, 10, 11, 15])).toEqual([
      framesAfter(5),
      framesAfter(15),
    ])
  })

  it("counts stacks during the lockout, the triggering hit and the explosion included", () => {
    expect(explosionFramesFor([0, 1, 2, 3, 4, 5, 10, 11, 12, 15])).toEqual([
      framesAfter(5),
      framesAfter(15),
    ])
    expect(explosionFramesFor([0, 1, 2, 3, 4, 5, 10, 11, 15])).toEqual([framesAfter(5)])
  })

  it("never fires inside the lockout even with Combustion regained", () => {
    expect(explosionFramesFor(consecutiveSeconds(0, 14))).toEqual([framesAfter(5)])
  })

  it("is a fixed 0.4 weapon-attack row without an attribute track, with its own breakdown row", () => {
    const events = fireEvents(consecutiveSeconds(0, 5)).filter(
      (event) => event.name === EXPLOSION_NAME,
    )
    expect(events).toHaveLength(1)
    expect(events[0].art).toMatchObject({
      physMultiplier: 0.4,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      guaranteedNormal: 1,
    })
    expect(events[0].qiRate).toBe(1)
    expect(events[0].skill.breakdownName).toBe(EXPLOSION_NAME)
  })

  it("is dealt in a run with fire selected, and never with poison", () => {
    const hitSeconds = consecutiveSeconds(0, 6)
    const withFire = runEngine(probeInputs(hitSeconds, { divinecraft: "fire" }))
    const withPoison = runEngine(probeInputs(hitSeconds))
    expect(eventsNamed(withFire.timeline, EXPLOSION_NAME)).toHaveLength(1)
    expect(eventsNamed(withPoison.timeline, EXPLOSION_NAME)).toHaveLength(0)
  })
})
