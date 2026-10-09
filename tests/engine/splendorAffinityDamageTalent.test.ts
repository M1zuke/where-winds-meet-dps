// Scoped to Bellstrike Splendor — see CLASSES.md § "Implemented classes". The
// Nameless Spear talent grants one Affinity DMG bonus behind two conditions,
// and the engine models each condition as its own buff, so the pair has to be
// asserted together or nothing notices them adding up.
import { describe, expect, it } from "vitest"
import { belowSixtyEndurance } from "../../src/data/skills/bellstrike-splendor/buffs/belowSixtyEndurance"
import { endlessGale } from "../../src/data/skills/bellstrike-splendor/buffs/endlessGale"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import type { StatusView } from "../../src/engine/ledger"

const CLASS = "bellstrikeSplendor"
const ENDURANCE_STATUS_ID = "meter:endurance"
const ENDURANCE_MAX_PARAM = "meterMax:endurance"

const enduranceEffectsWith = (opts: { active?: string[]; stacks?: number; max?: number }) => {
  const effects = belowSixtyEndurance.effects
  if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
  return effects({
    status: {
      isActive: (id: string) => (opts.active ?? []).includes(id),
      stacks: (id: string) => (id === ENDURANCE_STATUS_ID ? (opts.stacks ?? 0) : 0),
    },
    build: { paramValue: (id: string) => (id === ENDURANCE_MAX_PARAM ? (opts.max ?? 80) : 0) },
  } as never)
}

describe("the Nameless Spear Affinity DMG talent pays out once", () => {
  it("grants the bonus from the endurance condition alone", () => {
    expect(enduranceEffectsWith({ stacks: 40, max: 80 })).toEqual([
      { kind: "stat", statKey: "affinityDamageBoost", amount: 0.18 },
    ])
  })

  it("stands down while Endless Gale is the condition being met", () => {
    expect(enduranceEffectsWith({ active: [BUFF.endlessGale], stacks: 40, max: 80 })).toEqual([])
  })

  it("stands down once current Endurance reaches 60% of max", () => {
    expect(enduranceEffectsWith({ stacks: 48, max: 80 })).toEqual([])
  })

  it("is the same bonus on both sides, so neither can drift from the other", () => {
    const effects = endlessGale.effects
    if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
    expect(
      effects({ status: { isActive: (id: string) => id === BUFF.endlessGale } } as never),
    ).toEqual(enduranceEffectsWith({ stacks: 40, max: 80 }))
  })

  it("adds up to one bonus across the window closing and the low-Endurance condition taking over", () => {
    const engine = new BuffEngine(
      { classId: CLASS, [ENDURANCE_MAX_PARAM]: 80 },
      buffDefsForClass(CLASS),
    )
    const windowEndFrame = 300 // The gate's own 5s window, at 60fps.
    const view: StatusView = {
      activeIdsAt: () => [],
      isActiveAt: (id, frame) => id === BUFF.endlessGale && frame < windowEndFrame,
      stacksAt: () => 0,
      conditionStacksAt: () => 0,
      remainingFramesAt: () => undefined,
      framesSinceLastEnd: () => undefined,
      framesSinceStacksBelowThreshold: () => undefined,
      windowsOf: () => [],
    }
    engine.attachStatuses({ view, fps: 60 })
    const contribution = (buffId: string, time: number) =>
      engine.calculateDamageEffects(builtinSkill(CLASS, SKILL.swordq), time).breakdown[buffId] ?? 0

    expect(
      contribution(BUFF.endlessGaleAffinityBoost, 2) + contribution(BUFF.belowSixtyEndurance, 2),
    ).toBeCloseTo(0.18, 10)
    expect(contribution(BUFF.belowSixtyEndurance, 20)).toBeCloseTo(0.18, 10)
  })
})
