// Fictional skills verify resource scheduling, not any shipped class's DPS.
import { afterEach, describe, expect, it, vi } from "vitest"
import * as registry from "../../src/definitions/classes/registry"
import { defineResource } from "../../src/definitions/resources/resourceDef"
import { defaultInputs } from "../../src/engine/defaults"
import { makeSkill, makeHit } from "../../src/engine/skill"
import { makeDebuff } from "../../src/engine/debuff"
import { makeRotation, makeStep } from "../../src/engine/rotation"
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
  enhancedBuffId: "fictional-enhancement",
  enhancedExtraDrainPerSecond: 10,
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
    qiBreak: { startSec: 1, durationSec: 2, lowQiLeadSec: 0 },
  })
  return simulateTimeline({
    ...defaultInputs,
    classId,
    activeCustomRotation: rotation,
    customSkills: [launch, filler, tick],
    customDebuffs: [projectileDebuff],
    resourceSettings: { energy: { opening, gains: {}, exhaustedGainPerTick: refund } },
  })
}

describe("resource-driven timeline", () => {
  it("emits extra impacts only while the required mark is active at the impact time", () => {
    const original = BuffEngine.prototype.isBuffActiveAtTime
    vi.spyOn(BuffEngine.prototype, "isBuffActiveAtTime").mockImplementation(function (
      this: BuffEngine,
      id,
      time,
    ) {
      return id === "fictional-mark" ? time < 3 : original.call(this, id, time)
    })
    const result = run(0, undefined, 60, {
      ...debuff,
      dot: {
        ...debuff.dot!,
        additionalTicks: { offsetsFrames: [30], requiresBuff: "fictional-mark" },
      },
    })
    expect(
      result.timeline!.filter((event) => event.kind === "dot").map((event) => event.timeSec),
    ).toEqual([1, 1.5, 2, 2.5, 3, 4, 5])
    expect(result.resources![0].launches[0].ticks).toBe(7)
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
