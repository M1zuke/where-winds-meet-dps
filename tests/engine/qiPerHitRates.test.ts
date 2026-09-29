import { describe, expect, it } from "vitest"
import { bleedTick } from "../../src/data/skills/bellstrike-umbra/debuffs"
import { bleedDetonation } from "../../src/data/skills/bellstrike-umbra/bleed-detonation"
import {
  anxisoldierheng,
  anxisoldierhengStab,
} from "../../src/data/skills/stonesplit-strength/anxisoldierheng"
import { anxisoldiermojump } from "../../src/data/skills/stonesplit-strength/anxisoldiermojump"
import { anxisoldiermodown } from "../../src/data/skills/stonesplit-strength/anxisoldiermodown"
import { anxisoldiermosweep } from "../../src/data/skills/stonesplit-strength/anxisoldiermosweep"
import { falconsPursuit } from "../../src/data/skills/bamboocut-draught/falcons-pursuit"
import {
  dragonquenchStages,
  dragonquenchStagesAt,
} from "../../src/data/skills/bamboocut-draught/dragonquench-inebriate"
import { dragonquenchSecondStages } from "../../src/data/skills/bamboocut-draught/dragonquench-inebriate-second"
import { dragonquenchThirdStages } from "../../src/data/skills/bamboocut-draught/dragonquench-inebriate-third"
import { combustion, smolder, toadPoison, fluteRipple } from "../../src/data/skills/mystic/debuffs"
import { DRONE_TICK } from "../../src/data/skills/silkbind-jade/droneTick"
import { fireOilBurnMechanic } from "../../src/data/consumables/fireOilMechanic"
import { ROLE } from "../../src/data/skills/ids"
import type { MechanicSetup } from "../../src/engine/mechanics/types"
import { QiBar } from "../../src/engine/qiBar"
import type { Debuff } from "../../src/engine/debuff"

const QI_BAR = { max: 800, refill: 800, breakSec: 10, directImmunitySec: 4, takenIndex: 17.28 }
const FPS = 60

function qiRatesOf(hits: readonly { qiRate?: number }[]): (number | undefined)[] {
  return hits.map((hit) => hit.qiRate)
}

function dotQiRate(debuff: Debuff): number | undefined {
  return debuff.dot?.qiRate
}

// In-game values as of 2026-09-25.
describe("built-in Qi rates match the in-game table", () => {
  it("Bleeding ticks and Blood Burst carry rate 0.2", () => {
    expect(bleedTick.dot?.qiRate).toBe(0.2)
    expect(bleedDetonation.hits[0].qiRate).toBe(0.2)
  })

  it("every Anxi soldier summon attack carries rate 0.3", () => {
    for (const soldier of [
      anxisoldierheng,
      anxisoldierhengStab,
      anxisoldiermojump,
      anxisoldiermodown,
      anxisoldiermosweep,
    ]) {
      expect(qiRatesOf(soldier.hits)).toEqual(soldier.hits.map(() => 0.3))
    }
  })

  it("Falcon's Pursuit's three bullets carry the base rate 0.4", () => {
    expect(qiRatesOf(falconsPursuit.hits)).toEqual([0.4, 0.4, 0.4])
    expect(falconsPursuit.tags).toContain(ROLE.falconsPursuit)
  })

  it("every Dragonquench - Inebriate combo stage carries the base rate 0.65", () => {
    for (const stages of [dragonquenchStages, dragonquenchSecondStages, dragonquenchThirdStages]) {
      expect(qiRatesOf(stages)).toEqual(stages.map(() => 0.65))
    }
    expect(qiRatesOf(dragonquenchStagesAt([0, 0, 0, 0, 0, 0]))).toEqual([
      0.65, 0.65, 0.65, 0.65, 0.65, 0.65,
    ])
  })

  it("Smolder and Combustion ticks carry rate 0.6", () => {
    expect(smolder.dot?.qiRate).toBe(0.6)
    expect(combustion.dot?.qiRate).toBe(0.6)
  })

  it("Divinecraft Burn ticks carry rate 0.6 and never gain the direct-hit post-break immunity", () => {
    const setup: MechanicSetup = {
      inputs: { divinecraft: "fire" } as MechanicSetup["inputs"],
      classId: "bellstrikeUmbra",
      fps: 60,
      rotationDurationSec: 10,
      hitTimesSec: [0],
      weaponHitTimesSec: [0],
      dotTickTimesSec: [],
      qiPhaseAt: () => "normal",
      paramOn: () => false,
      paramTier: () => 0,
      hasBuffEngine: false,
      effectiveRates: { precision: 1, critRate: 1, affinityRate: 1 },
    }
    const events = fireOilBurnMechanic().extraEvents?.({}, setup) ?? []
    expect(events.length).toBeGreaterThan(0)
    for (const event of events) {
      expect(event.qiRate).toBe(0.6)
      expect(event.qiHitKind).toBe("dot")
    }
  })

  it("Toad Poison's explosion keeps the default rate 1, tagged for the class-wide Toad Venom bonus", () => {
    expect(dotQiRate(toadPoison)).toBeUndefined()
    expect(toadPoison.tags).toContain(ROLE.toadVenom)
  })

  it("Flute Ripple is untagged for Qi rate — its rate stays the default 1", () => {
    expect(dotQiRate(fluteRipple)).toBeUndefined()
    expect(fluteRipple.dot?.directHit).toBe(true)
  })
})

describe("the silkbind Jade drone family deals no Qi inside the post-refill immunity window", () => {
  it("types the drone tick a direct hit for the Qi rule, without changing its damage typing", () => {
    expect(DRONE_TICK.qiHitKind).toBe("direct")
  })

  it("a drone tick inside the 4 s post-refill window deals no Qi", () => {
    const bar = new QiBar(QI_BAR, FPS)
    bar.apply(0, 800, "direct")
    // Refill lands at frame 600 (10 s); the direct-hit immunity runs to 840 (14 s).
    bar.apply(600 + 30, 50, DRONE_TICK.qiHitKind)
    const schedule = bar.schedule()
    expect(schedule.fractionAt((600 + 30) / FPS)).toBe(1)
  })
})
