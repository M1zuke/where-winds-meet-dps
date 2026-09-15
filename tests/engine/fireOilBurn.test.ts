import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { graduationInputs } from "../../src/engine/graduation"
import { DEFAULT_QI_BREAK_WINDOW } from "../../src/engine/qiBreak"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { defaultCombatSettings } from "../../src/engine/types"
import type { Inputs, QiBreakWindow, TimelineEvent } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const BURN_NAME = "Divinecraft - Fire"

function burnTicks(timeline: TimelineEvent[] | undefined): TimelineEvent[] {
  return (timeline ?? []).filter((event) => event.skillName === BURN_NAME)
}

function hitsAtSeconds(seconds: readonly number[]): ReturnType<typeof makeHit>[] {
  return seconds.map((sec) => makeHit({ frame: Math.round(sec * 60), physMultiplier: 0.1 }))
}

function probeInputs(
  hitSeconds: readonly number[],
  overrides: Partial<Inputs> = {},
  castFramesOverride?: number,
): Inputs {
  const hits = hitsAtSeconds(hitSeconds)
  const lastFrame = hits.length > 0 ? hits[hits.length - 1].frame : 0
  const skill = makeSkill(CLASS, {
    name: "Probe Hit",
    castFrames: castFramesOverride ?? lastFrame + 60,
    hits,
  })
  return {
    ...defaultInputs,
    classId: CLASS,
    set: null,
    tianGongElement: "fire",
    customSkills: [skill],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: skill.id })],
    }),
    ...overrides,
  }
}

describe("Fire Oil Burn — ticks only with the fire oil selected", () => {
  it.each(["poison", null] as const)("produces no ticks for tianGongElement %s", (element) => {
    const result = runEngine(probeInputs([0, 1, 2], { tianGongElement: element }))
    expect(burnTicks(result.timeline).length).toBe(0)
  })

  it("produces ticks when fire oil is selected", () => {
    const result = runEngine(probeInputs([0, 1, 2]))
    expect(burnTicks(result.timeline).length).toBeGreaterThan(0)
  })
})

describe("Fire Oil Burn — schedule", () => {
  it("a hit every second for 60 s ticks exactly 60 times, the first at 0.5 s", () => {
    const seconds = Array.from({ length: 60 }, (_, index) => index)
    const result = runEngine(probeInputs(seconds, {}, 60 * 60))
    const ticks = burnTicks(result.timeline)
    expect(ticks.length).toBe(60)
    expect(ticks[0].timeSec).toBeCloseTo(0.5, 9)
  })

  it("a gap longer than 4 s stops the ticks and the next hit restarts the grid", () => {
    const result = runEngine(probeInputs([0, 10], {}, 15 * 60))
    const tickTimes = burnTicks(result.timeline).map((event) => event.timeSec)
    expect(tickTimes).toEqual([0.5, 1.5, 2.5, 3.5, 10.5, 11.5, 12.5, 13.5])
  })
})

describe("Fire Oil Burn — always the plain row", () => {
  it("is unaffected by crit- and affinity-damage boosts", () => {
    const low = runEngine(probeInputs([0, 1, 2], { critDamageBoost: 0, affinityDamageBoost: 0 }))
    const high = runEngine(probeInputs([0, 1, 2], { critDamageBoost: 2, affinityDamageBoost: 2 }))
    const lowTicks = burnTicks(low.timeline)
    const highTicks = burnTicks(high.timeline)
    expect(lowTicks.length).toBeGreaterThan(0)
    expect(highTicks.map((e) => e.damage)).toEqual(lowTicks.map((e) => e.damage))
  })

  it("is unaffected by a weapon boost or the all-martial boost", () => {
    const base = runEngine(probeInputs([0, 1, 2]))
    const boosted = runEngine(probeInputs([0, 1, 2], { swordBoost: 0.5, allMartialBoost: 0.5 }))
    const baseTicks = burnTicks(base.timeline)
    const boostedTicks = burnTicks(boosted.timeline)
    expect(baseTicks.length).toBeGreaterThan(0)
    expect(boostedTicks.map((e) => e.damage)).toEqual(baseTicks.map((e) => e.damage))
  })

  it("scales by exactly the Exhausted factor when a tick lands inside the Qi-break window", () => {
    const seconds = Array.from({ length: 40 }, (_, index) => index)
    const withBreak = runEngine(
      probeInputs(seconds, {
        combatSettings: { ...defaultCombatSettings(), qiBreakOverride: null },
      }),
    )
    const withoutBreak = runEngine(
      probeInputs(seconds, {
        combatSettings: {
          ...defaultCombatSettings(),
          qiBreakOverride: { ...DEFAULT_QI_BREAK_WINDOW, durationSec: 0 } as QiBreakWindow,
        },
      }),
    )
    const withBreakTicks = burnTicks(withBreak.timeline)
    const withoutBreakTicks = burnTicks(withoutBreak.timeline)
    expect(withBreakTicks.length).toBe(withoutBreakTicks.length)

    const breakStart = DEFAULT_QI_BREAK_WINDOW.startSec
    const breakEnd = breakStart + DEFAULT_QI_BREAK_WINDOW.durationSec
    let sawTickInWindow = false
    for (let index = 0; index < withBreakTicks.length; index++) {
      const withTick = withBreakTicks[index]
      const withoutTick = withoutBreakTicks[index]
      const insideWindow = withTick.timeSec >= breakStart && withTick.timeSec < breakEnd
      expect(withTick.damage / withoutTick.damage, `tick@${withTick.timeSec}`).toBeCloseTo(
        insideWindow ? 1.1 : 1,
        9,
      )
      if (insideWindow) sawTickInWindow = true
    }
    expect(sawTickInWindow).toBe(true)
  })
})

describe("Fire Oil Burn — pre-pull casts never open a window", () => {
  it("a damaging pre-pull cast schedules no ticks on its own", () => {
    const prePullSkill = makeSkill(CLASS, {
      name: "Prepull Hit",
      prePull: true,
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 0.1 })],
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      set: null,
      tianGongElement: "fire",
      customSkills: [prePullSkill],
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: prePullSkill.id })],
      }),
    }
    const result = runEngine(inputs)
    expect(burnTicks(result.timeline).length).toBe(0)
  })
})

describe("Fire Oil Burn — the graduation build", () => {
  it("the Bamboocut Draught graduation build's burn row is a real share of its total", () => {
    const grad = graduationInputs({ ...defaultInputs, classId: "bamboocutDraught" })!
    const toEngineInputs = (raw: Inputs) => applyBowSet(applyArmorSet(withDerivedStats(raw)))
    const result = runEngine(toEngineInputs(grad))
    const burnRow = result.perSkill.find((row) => row.name === BURN_NAME)
    expect(burnRow).toBeDefined()
    expect(burnTicks(result.timeline).length).toBeGreaterThan(0)
    expect(burnRow!.percentOfTotal).toBeGreaterThan(0)
  })
})
