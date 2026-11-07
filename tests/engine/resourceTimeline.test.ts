// Fictional skills verify resource scheduling, not any shipped class's DPS.
import { afterEach, describe, expect, it, vi } from "vitest"
import * as registry from "../../src/definitions/classes/registry"
import { defineResource } from "../../src/definitions/resources/resourceDef"
import { defaultInputs } from "../../src/engine/defaults"
import { makeSkill, makeHit } from "../../src/engine/skill"
import { makeDebuff } from "../../src/engine/debuff"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { simulateTimeline } from "../../src/engine/timeline"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"

const classId = "fictionalResourceClass"
const resource = defineResource({
  id: "energy",
  name: "Energy",
  capacity: 100,
  launchMinimum: 50,
  defaultOpening: 60,
  launchSkillId: "fictional-launch",
  debuffId: "fictional-projectiles",
  drainPerSecond: 10,
  enhancedRunCost: 5,
  recallTag: "fictional-weapon",
  recallExemptSkillIds: ["fictional-exempt"],
  endRefund: 15,
  refundCooldownSeconds: 5,
  gains: [],
})
const launch = makeSkill(classId, {
  id: resource.launchSkillId,
  name: "Launch",
  castFrames: 60,
  hits: [
    makeHit({
      frame: 0,
      physMultiplier: 1,
      triggers: [{ kind: "applyDebuff", targetId: resource.debuffId, stacks: 1, condition: null }],
    }),
  ],
})
const filler = makeSkill(classId, {
  id: "fictional-wait",
  name: "Wait",
  castFrames: 60,
  hits: [makeHit({ frame: 0 })],
})
const tick = makeSkill(classId, {
  id: "fictional-tick",
  name: "Tick",
  castFrames: 0,
  hits: [makeHit({ frame: 0, physMultiplier: 1 })],
})
const debuff = makeDebuff(classId, {
  id: resource.debuffId,
  name: "Projectiles",
  durationFrames: 3600,
  dot: {
    sourceSkillId: tick.id,
    tickIntervalFrames: 60,
    physMultiplier: 1,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 1,
    attributeAttack: "",
    skillType: "sustain",
    count: 1,
    perStackShapes: null,
  },
})

afterEach(() => vi.restoreAllMocks())

function run(
  refund: number,
  steps = [launch, ...Array<typeof filler>(9).fill(filler)],
  opening = 60,
  projectileDebuff = debuff,
  extraSkills: (typeof filler)[] = [],
) {
  const base = registry.classDefinition(defaultInputs.classId)!
  vi.spyOn(registry, "classDefinition").mockReturnValue({
    ...base,
    id: classId,
    resources: [resource],
  })
  const rotation = makeRotation(classId, {
    fixedWindowSec: steps.length,
    steps: steps.map((skill) => makeStep({ skillId: skill.id })),
  })
  return simulateTimeline(
    {
      ...defaultInputs,
      classId,
      activeCustomRotation: rotation,
      customSkills: [launch, filler, tick, ...extraSkills],
      customDebuffs: [projectileDebuff],
      resourceSettings: { energy: { opening, gains: {}, exhaustedGainPerTick: refund } },
    },
    // A fixed, clock-driven exhausted window, deterministic regardless of
    // this fictional rotation's own (near-zero) damage.
    { fixedQiBreaks: [{ startSec: 1, durationSec: 2, lowQiLeadSec: 0 }] },
  )
}

describe("resource-driven timeline", () => {
  function runWithMark(isMarked: (time: number) => boolean) {
    const original = BuffEngine.prototype.isBuffActiveAtTime
    vi.spyOn(BuffEngine.prototype, "isBuffActiveAtTime").mockImplementation(function (
      this: BuffEngine,
      id,
      time,
    ) {
      return id === "fictional-mark" ? isMarked(time) : original.call(this, id, time)
    })
    return run(0, undefined, 60, {
      ...debuff,
      dot: {
        ...debuff.dot!,
        additionalTicks: { offsetsFrames: [30], requiresBuff: "fictional-mark" },
      },
    })
  }
  const dotTimes = (result: ReturnType<typeof run>) =>
    result.timeline!.filter((event) => event.kind === "dot").map((event) => event.timeSec)

  it("emits an extra impact only for a pulse whose start sees the mark, and charges that run", () => {
    const result = runWithMark((time) => time < 3)
    expect(dotTimes(result)).toEqual([1, 1.5, 2, 2.5, 3, 4])
    expect(result.resources![0].launches[0].ticks).toBe(6)
  })
  it("leaves a pulse plain when the mark lands between its start and its extra impact", () => {
    const result = runWithMark((time) => time >= 1.2 && time < 3)
    expect(dotTimes(result)).toEqual([1, 2, 2.5, 3, 4, 5])
  })
  it("recalls on a cast carrying the recall tag, but not on an exempt one", () => {
    const tagged = { ...filler, id: "fictional-tagged", tags: ["fictional-weapon"] }
    const exempt = { ...tagged, id: "fictional-exempt" }
    const recalled = run(0, [launch, filler, tagged, filler], 100, debuff, [tagged])
    expect(recalled.resources![0].launches[0].reason).toBe("recalled")
    expect(dotTimes(recalled)).toEqual([1])
    vi.restoreAllMocks()
    const kept = run(0, [launch, filler, exempt, filler], 100, debuff, [exempt])
    expect(kept.resources![0].launches[0].reason).toBe("fightEnd")
  })
  it("turns exhausted-hit refunds into additional actual damage ticks", () => {
    const dry = run(0)
    vi.restoreAllMocks()
    const wet = run(10)
    expect(dry.resources![0].launches[0].ticks).toBe(5)
    expect(wet.resources![0].launches[0].ticks).toBe(7)
    expect(wet.timeline!.filter((event) => event.kind === "dot")).toHaveLength(7)
    expect(wet.totalDamage).toBeGreaterThan(dry.totalDamage)
    expect(wet.buffWindows!.find((window) => window.id === debuff.id)?.endSec).toBe(8)
  })
  it("suppresses the launch hit, ticks and displayed status when underfunded", () => {
    const result = run(10, undefined, 49)
    expect(
      result.timeline!.filter((event) => event.skillName === launch.name || event.kind === "dot"),
    ).toHaveLength(0)
    expect(result.resources![0].launches[0].reason).toBe("insufficient")
    expect(result.buffWindows!.filter((window) => window.id === debuff.id)).toHaveLength(0)
  })
  it("recalls on a second press and starts a fresh tick cadence on the next launch", () => {
    const result = run(0, [launch, filler, launch, launch, filler, filler], 100)
    expect(result.resources![0].launches.map((entry) => entry.reason)).toEqual([
      "recalled",
      "fightEnd",
    ])
    expect(
      result.timeline!.filter((event) => event.kind === "dot").map((event) => event.timeSec),
    ).toEqual([1, 4, 5, 6])
  })
})
