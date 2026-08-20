import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { CAST } from "../../src/data/skills/ids"
import { makeSkill } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultRotationForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"

const MARK_DURATION = 2

function jadeEngine() {
  return new BuffEngine({ classId: "silkbindJade" }, buffDefsForClass("silkbindJade"), [])
}

function applyMark(engine: BuffEngine, time: number) {
  engine.processSkillCast(CAST.fanSpecial, time, {}, false, [BUFF.lingeringBone])
}

function droneTick(engine: BuffEngine, time: number) {
  engine.triggerDeclaredBuffs([BUFF.lingeringBone], CAST.umbDroneTick20hit, time, {
    isDrone: true,
  })
}

const droneHit = makeSkill("test", {
  name: "UmbDrone Tick",
  receives: [BUFF.lingeringBone],
})

function droneDamageFactor(engine: BuffEngine, time: number): number {
  return engine.calculateDamageEffects(droneHit, time).damageFactor
}

describe("lingeringBone — a drone projectile extends the mark but never opens one", () => {
  it("a drone tick on an unmarked target applies nothing", () => {
    const engine = jadeEngine()
    droneTick(engine, 0)
    expect(engine.isBuffActiveAtTime(BUFF.lingeringBone, 0)).toBe(false)
  })

  it("Fan Special opens the mark, and it lapses on its own after its duration", () => {
    const engine = jadeEngine()
    applyMark(engine, 0)
    expect(engine.isBuffActiveAtTime(BUFF.lingeringBone, MARK_DURATION - 0.1)).toBe(true)
    expect(engine.isBuffActiveAtTime(BUFF.lingeringBone, MARK_DURATION + 0.1)).toBe(false)
  })

  it("a drone tick reopens the mark for its full duration, counted from that tick", () => {
    const engine = jadeEngine()
    applyMark(engine, 0)
    droneTick(engine, 1.5)
    expect(engine.isBuffActiveAtTime(BUFF.lingeringBone, 1.5 + MARK_DURATION - 0.1)).toBe(true)
    expect(engine.isBuffActiveAtTime(BUFF.lingeringBone, 1.5 + MARK_DURATION + 0.1)).toBe(false)
  })

  it("drone ticks inside the window carry it past where it would have lapsed", () => {
    const engine = jadeEngine()
    applyMark(engine, 0)
    for (let tick = 0.3; tick <= 6; tick += 0.3) droneTick(engine, tick)
    expect(engine.isBuffActiveAtTime(BUFF.lingeringBone, 6)).toBe(true)
  })

  it("stops extending once the window has already lapsed", () => {
    const engine = jadeEngine()
    applyMark(engine, 0)
    droneTick(engine, MARK_DURATION + 0.3)
    expect(engine.isBuffActiveAtTime(BUFF.lingeringBone, MARK_DURATION + 0.4)).toBe(false)
  })
})

describe("lingeringBone — the doubling reaches the drone and nothing else", () => {
  it("doubles a drone projectile while the mark is up", () => {
    const engine = jadeEngine()
    applyMark(engine, 0)
    expect(droneDamageFactor(engine, 1)).toBe(2)
  })

  it("leaves a drone projectile alone with no mark up", () => {
    const engine = jadeEngine()
    expect(droneDamageFactor(engine, 1)).toBe(1)
  })

  it("reaches only what names it — a skill without it in receives is untouched", () => {
    const engine = jadeEngine()
    applyMark(engine, 0)
    const otherHit = makeSkill("test", { name: "Fan Q" })
    expect(engine.calculateDamageEffects(otherHit, 1).damageFactor).toBe(1)
  })
})

// The drone's extension is applied from a DoT tick, and a tick-applied buff
// reaches its own later ticks but never a cast chip — the reach limit
// `dotTriggersBuffs.test.ts` pins. So a chip here only ever shows the window an
// applying cast opened, even though the drone's own ticks are scored against
// the extended one.
describe("lingeringBone — through the built-in Silkbind Jade rotation", () => {
  const rotation = defaultRotationForClass("silkbindJade")!
  const inputs: Inputs = {
    ...defaultInputs,
    classId: "silkbindJade",
    activeCustomRotation: rotation,
  }
  const casts = simulateTimeline(inputs).casts ?? []
  const marked = casts.filter((cast) => cast.buffs.some((buff) => buff.name === "Lingering Bone"))
  const remainingOf = (cast: (typeof casts)[number]) =>
    cast.buffs.find((buff) => buff.name === "Lingering Bone")!.remainingSec!

  it("puts the mark on a cast's buff chips at all", () => {
    expect(marked.length).toBeGreaterThan(0)
  })

  it("reports what is left of the window at that cast, never the def's own duration", () => {
    for (const cast of marked) {
      expect(remainingOf(cast)).toBeGreaterThan(0)
      expect(remainingOf(cast)).toBeLessThanOrEqual(MARK_DURATION)
    }
  })
})
