// Scoped to Bellstrike Umbra's Morale Chant, Hawkwing and Fire Oil
// — see CLASSES.md § "Implemented classes"; these assert which mechanics listen
// to a mechanic's own extra events, not damage.
import { describe, expect, it } from "vitest"
import { fireOilBurnMechanic } from "../../src/data/consumables/divinecraftMechanics"
import { moraleChantMechanic } from "../../src/data/innerWays/moraleChantMechanic"
import { hawkwingMechanic } from "../../src/data/sets/hawkwingMechanic"
import { SET_ID } from "../../src/data/sets/ids"
import { PARAM } from "../../src/data/skills/buffs/ids"
import { defaultInputs } from "../../src/engine/defaults"
import type {
  MechanicEvent,
  MechanicHost,
  MechanicObservedEvent,
  MechanicSetup,
} from "../../src/engine/mechanics/types"
import { mulberry32 } from "../../src/engine/rng"
import { driveMechanic } from "../helpers/driveMechanic"
import { gearSetFields } from "../helpers/withGearSet"

const CLASS = "bellstrikeUmbra"
const FPS = 60

function setupWith(patch: Partial<MechanicSetup["inputs"]> = {}): MechanicSetup {
  return {
    inputs: {
      ...defaultInputs,
      classId: CLASS,
      ...gearSetFields(SET_ID.hawkwing, { fabricatePieces: true }),
      directAffinityRate: 1,
      ...patch,
    },
    classId: CLASS,
    fps: FPS,
    qiPhaseAt: () => "normal",
    paramOn: (name) => name === PARAM.moraleChant,
    paramTier: () => 6,
    hasBuffEngine: true,
    effectiveRates: { precision: 1, critRate: 0, affinityRate: 1 },
    collectHistory: true,
    rng: mulberry32(1),
  }
}

function yiRiverEvent(): MechanicEvent {
  const [event] = driveMechanic(moraleChantMechanic(), setupWith(), {
    hitTimesSec: [],
    windowEndSec: 60,
  })
  return event!
}

function observedFrom(event: MechanicEvent): MechanicObservedEvent {
  return {
    source: "extra",
    timeSec: event.frame / FPS,
    occurrence: 1,
    direct: event.direct,
    canRollAffinity: event.art.guaranteedNormal !== 1,
    affinityChance: 0,
  }
}

describe("Yi River, a mechanic's own direct extra event", () => {
  it("is declared a direct hit that can roll Affinity", () => {
    const event = yiRiverEvent()
    expect(event.skill.name).toBe("Yi River")
    expect(event.direct).toBe(true)
    expect(observedFrom(event).canRollAffinity).toBe(true)
  })

  it("rolls a Hawkwing stack", () => {
    const setup = setupWith()
    const mechanic = hawkwingMechanic(SET_ID.hawkwing, "Hawkwing")
    const state = mechanic.prepare(setup)!
    mechanic.observeEvent!(state, observedFrom(yiRiverEvent()), setup, {} as MechanicHost)
    expect(state.tracker.expectedStacksAt(yiRiverEvent().frame / FPS + 0.1)).toBeGreaterThan(0)
  })

  it("counts toward the Fire Oil burn", () => {
    const setup = setupWith({ divinecraft: "fire" })
    const mechanic = fireOilBurnMechanic()
    const state = mechanic.prepare(setup)!
    const scheduled: MechanicEvent[] = []
    const host = { scheduleExtra: (event: MechanicEvent) => scheduled.push(event) }
    mechanic.observeEvent!(
      state,
      observedFrom(yiRiverEvent()),
      setup,
      host as unknown as MechanicHost,
    )
    expect(scheduled.map((event) => event.name)).toEqual(["Divinecraft - Fire"])
  })
})

describe("Fire Oil's own extra events", () => {
  it("burn ticks are not direct hits, so they never feed Fire Oil again", () => {
    const events = driveMechanic(fireOilBurnMechanic(), setupWith({ divinecraft: "fire" }), {
      hitTimesSec: [0],
      windowEndSec: 30,
    })
    expect(events.length).toBeGreaterThan(0)
    for (const event of events) expect(event.direct).toBe(false)
  })

  it("the explosion is a direct hit, and the lockout keeps it from triggering another", () => {
    const setup = setupWith({ divinecraft: "fire" })
    const mechanic = fireOilBurnMechanic()
    const state = mechanic.prepare(setup)!
    const scheduled: MechanicEvent[] = []
    const host = { scheduleExtra: (event: MechanicEvent) => scheduled.push(event) }
    const feed = (event: MechanicObservedEvent) =>
      mechanic.observeEvent!(state, event, setup, host as unknown as MechanicHost)
    const explosions = () =>
      scheduled.filter((event) => event.name === "Divinecraft - Fire Explosion")
    const hitAt = (timeSec: number): MechanicObservedEvent => ({
      source: "hit",
      timeSec,
      occurrence: 1,
      direct: true,
      canRollAffinity: true,
      affinityChance: 0,
    })

    for (let hit = 0; hit <= 5; hit++) feed(hitAt(hit * 0.1))
    const [explosion] = explosions()
    expect(explosion.direct).toBe(true)

    feed(observedFrom(explosion))
    for (let hit = 0; hit < 5; hit++) feed(hitAt(0.7 + hit * 0.1))
    expect(explosions()).toHaveLength(1)
  })
})
