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
import type { Inputs, TimelineEvent } from "../../src/engine/types"
import { testRotation as makeRotation } from "../builtins"

const CLASS = "bellstrikeUmbra"
const POISON_NAME = "Divinecraft - Poison"
const EXPLOSION_NAME = "Divinecraft - Fire Explosion"
const FPS = 60

function consecutiveSeconds(first: number, last: number): number[] {
  return Array.from({ length: last - first + 1 }, (_, index) => first + index)
}

function setupWithHits(
  divinecraft: Inputs["divinecraft"],
  hitTimesSec: readonly number[],
  rotationDurationSec = 60,
): MechanicSetup {
  return {
    inputs: { divinecraft } as MechanicSetup["inputs"],
    classId: CLASS,
    fps: FPS,
    rotationDurationSec,
    windowStartSec: 0,
    hitTimesSec,
    weaponHitTimesSec: hitTimesSec,
    dotTickTimesSec: [],
    qiPhaseAt: () => "normal",
    paramOn: () => false,
    paramTier: () => 0,
    hasBuffEngine: false,
    effectiveRates: { precision: 1, critRate: 1, affinityRate: 1 },
  }
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
    set: null,
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
    (
      toxicPowderPoisonedMechanic().extraEvents?.(
        {},
        setupWithHits("poison", hitTimesSec, rotationDurationSec),
      ) ?? []
    ).map((event) => event.frame / FPS)

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
  const events = toxicPowderPoisonedMechanic().extraEvents?.({}, setupWithHits("poison", [0])) ?? []

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
    const contribution = toxicPowderPoisonedMechanic().contributeAt?.(
      {},
      0,
      undefined,
      setupWithHits("poison", [0]),
    )
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
  const explosionsFor = (hitTimesSec: number[]) =>
    (fireOilBurnMechanic().extraEvents?.({}, setupWithHits("fire", hitTimesSec)) ?? [])
      .filter((event) => event.name === EXPLOSION_NAME)
      .map((event) => event.frame / FPS)

  it("the next direct hit after the fifth stack explodes", () => {
    expect(explosionsFor(consecutiveSeconds(0, 5))).toEqual([5])
  })

  it("four stacks and a sixth hit never reach Combustion", () => {
    expect(explosionsFor([0, 1, 2, 3])).toEqual([])
  })

  it("Combustion that expires without a direct hit produces no explosion", () => {
    expect(explosionsFor([0, 1, 2, 3, 4, 10])).toEqual([])
  })

  it("stacks refresh on each new stack and lapse after 5 s without one", () => {
    expect(explosionsFor([0, 1, 2, 3, 9, 10, 11])).toEqual([])
    expect(explosionsFor([0, 1.5, 3, 4.5, 6, 7])).toEqual([7])
  })

  it("gains no stacks during the 5 s cooldown after an explosion", () => {
    expect(explosionsFor(consecutiveSeconds(0, 14))).toEqual([5])
    expect(explosionsFor(consecutiveSeconds(0, 15))).toEqual([5, 15])
  })

  it("is a fixed 0.4 weapon-attack row without an attribute track, with its own breakdown row", () => {
    const events = (
      fireOilBurnMechanic().extraEvents?.({}, setupWithHits("fire", consecutiveSeconds(0, 5))) ?? []
    ).filter((event) => event.name === EXPLOSION_NAME)
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
