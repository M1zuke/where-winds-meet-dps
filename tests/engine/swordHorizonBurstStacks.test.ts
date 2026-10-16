import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { simulateTimeline, FPS } from "../../src/engine/timeline"
import { makeBuff, type Buff } from "../../src/engine/buff"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill, testRotation as makeRotation } from "../builtins"
import { applyBuff, applyDot, detonateDot } from "../../src/definitions/skills/triggers"
import { DEBUFF, SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { ZENITH_BAR_BUFF_ID } from "../../src/data/innerWays/swordHorizonZenith"

const CLASS = "bellstrikeUmbra"
const FIFTH_STACK_FRAME = 14
const BURST_FRAME = FIFTH_STACK_FRAME + builtinSkill(CLASS, SKILL.bleedDetonation).hits[0]!.frame
const BEFORE_BURST_FRAME = BURST_FRAME - 3
const AFTER_BURST_FRAME = BURST_FRAME + 2
const CAST_FRAMES = 120

const clearedBeforeBurst = makeBuff(CLASS, { name: "Cleared Before The Burst" })
const twoStacksAfterBurst = makeBuff(CLASS, { name: "Two Stacks After The Burst" })
const noStacksAfterBurst = makeBuff(CLASS, { name: "No Stacks After The Burst" })

const stacksAre = (stacks: number) => ({ buffId: DEBUFF.bleedTick, op: "eq" as const, stacks })

function probe(frame: number, marker: Buff, stacks: number) {
  return makeHit({
    frame,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    triggers: [applyBuff({ target: marker.id, condition: stacksAre(stacks) })],
  })
}

const detonator: Skill = makeSkill(CLASS, {
  name: "Five Stacks",
  castFrames: CAST_FRAMES,
  hits: [
    ...[10, 11, 12, 13].map((frame) =>
      makeHit({
        frame,
        physMultiplier: 0,
        attributeMultiplier: 0,
        physFixed: 0,
        attributeFixed: 0,
        triggers: [applyDot({ target: DEBUFF.bleedTick })],
      }),
    ),
    makeHit({
      frame: FIFTH_STACK_FRAME,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyDot({ target: DEBUFF.bleedTick }),
        detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
    probe(BEFORE_BURST_FRAME, clearedBeforeBurst, 0),
    probe(AFTER_BURST_FRAME, twoStacksAfterBurst, 2),
    probe(AFTER_BURST_FRAME, noStacksAfterBurst, 0),
  ],
})

const needsTwoStacks: Skill = makeSkill(CLASS, {
  name: "Needs Two Stacks",
  castFrames: 30,
  castConditions: [stacksAre(2)],
  hits: [makeHit({ frame: 0, physMultiplier: 0, attributeMultiplier: 0 })],
})

function run(options: { swordHorizonTier: "tier 5" | "tier 6"; spirit: number; steps: Skill[] }) {
  const rotation = makeRotation(CLASS, {
    steps: options.steps.map((skill) => makeStep({ skillId: skill.id })),
    openingStacks: { [ZENITH_BAR_BUFF_ID]: options.spirit },
  })
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    customSkills: [detonator, needsTwoStacks],
    customBuffs: [clearedBeforeBurst, twoStacksAfterBurst, noStacksAfterBurst],
    activeCustomRotation: rotation,
    mindMethods: [
      { name: "Sword Horizon", stacks: options.swordHorizonTier },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
    ],
  }
  return simulateTimeline(inputs)
}

const startFramesOf = (result: ReturnType<typeof run>, marker: Buff) =>
  (result.buffWindows ?? [])
    .filter((window) => window.id === marker.id)
    .map((window) => Math.round(window.startSec * FPS))

describe("Sword Horizon tier 6 re-adds 2 Bleeding stacks as the Blood Burst lands", () => {
  it("clears the stacks at the detonating hit and returns two when the burst lands 6 frames later", () => {
    const result = run({ swordHorizonTier: "tier 6", spirit: 1, steps: [detonator] })
    expect(startFramesOf(result, clearedBeforeBurst)).toEqual([BEFORE_BURST_FRAME])
    expect(startFramesOf(result, twoStacksAfterBurst)).toEqual([AFTER_BURST_FRAME])
    expect(startFramesOf(result, noStacksAfterBurst)).toEqual([])
  })

  it("returns nothing while Sword Spirit is empty", () => {
    const result = run({ swordHorizonTier: "tier 6", spirit: 0, steps: [detonator] })
    expect(startFramesOf(result, twoStacksAfterBurst)).toEqual([])
    expect(startFramesOf(result, noStacksAfterBurst)).toEqual([AFTER_BURST_FRAME])
  })

  it("banks Sword Spirit from the first burst, so the next one returns the stacks", () => {
    const result = run({ swordHorizonTier: "tier 6", spirit: 0, steps: [detonator, detonator] })
    expect(startFramesOf(result, twoStacksAfterBurst)).toEqual([CAST_FRAMES + AFTER_BURST_FRAME])
    expect(startFramesOf(result, noStacksAfterBurst)).toEqual([AFTER_BURST_FRAME])
  })

  it("returns nothing below tier 6", () => {
    const result = run({ swordHorizonTier: "tier 5", spirit: 1, steps: [detonator] })
    expect(startFramesOf(result, twoStacksAfterBurst)).toEqual([])
  })

  it("is the same in the layout a later step's cast condition reads", () => {
    const withSpirit = run({
      swordHorizonTier: "tier 6",
      spirit: 1,
      steps: [detonator, needsTwoStacks],
    })
    expect(withSpirit.invalidStepIds ?? []).toEqual([])
    const withoutSpirit = run({
      swordHorizonTier: "tier 6",
      spirit: 0,
      steps: [detonator, needsTwoStacks],
    })
    expect(withoutSpirit.invalidStepIds ?? []).toHaveLength(1)
  })
})
