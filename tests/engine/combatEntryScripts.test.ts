// Scoped to Bellstrike Umbra for the full-rotation checks — see CLAUDE.md
// § "Implemented classes". The engine-level checks probe the buff engine
// directly and hold for every class alike, since both scripts are `affectsAll`.
import { describe, expect, it } from "vitest"
import { buffEngineWith } from "../helpers/qiBars"
import { testRotation } from "../builtins"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { SCRIPT_MIN_BREAKTHROUGH } from "../../src/data/skills/buffs/scriptOptions"
import { IN_COMBAT_STATUS } from "../../src/engine/combatState"
import { defaultInputs } from "../../src/engine/defaults"
import { StatusLedger } from "../../src/engine/ledger"
import { makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultCombatSettings, type Inputs, type ScriptId } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const FPS = 60
const UNLOCKED_BREAKTHROUGH = 20

const SCRIPTS = [
  ["wavebornScript", "critDamageBoost"],
  ["clearfallScript", "affinityDamageBoost"],
] as const

function engineEnteringCombatAt(
  script: ScriptId,
  entryFrame: number | null,
  breakthrough = UNLOCKED_BREAKTHROUGH,
) {
  const ledger = new StatusLedger(-600, 100_000)
  ledger.openPermanent(IN_COMBAT_STATUS)
  if (entryFrame !== null) ledger.recordStack(IN_COMBAT_STATUS, entryFrame, 1)
  const engine = buffEngineWith({ [script]: true, breakthrough }, GLOBAL_BUFF_DEFS)
  engine.attachStatuses({ view: ledger, fps: FPS })
  return engine
}

function bonusAt(
  engine: ReturnType<typeof engineEnteringCombatAt>,
  timeSec: number,
  statKey: string,
) {
  return (
    engine
      .calculateDamageEffects(makeSkill("test", { name: "probe" }), timeSec)
      .effects.find((effect) => effect.statKey === statKey)?.amount ?? 0
  )
}

describe.each(SCRIPTS)("%s — stacks by time since combat entry", (script, statKey) => {
  const ENTRY_FRAME = 600
  const ENTRY_SEC = ENTRY_FRAME / FPS
  const engine = () => engineEnteringCombatAt(script, ENTRY_FRAME)
  const stacksAt = (timeSec: number) => Math.round(bonusAt(engine(), timeSec, statKey) * 100)

  it("gives the hit that causes combat entry no stack", () => {
    expect(stacksAt(ENTRY_SEC)).toBe(0)
  })

  it("gives a hit after the entry its first stack", () => {
    expect(stacksAt(ENTRY_SEC + 2e-6)).toBe(1)
    expect(stacksAt(ENTRY_SEC + 0.1)).toBe(1)
  })

  it("gains the next stack at exactly three seconds and every three seconds after", () => {
    expect(stacksAt(ENTRY_SEC + 2.9)).toBe(1)
    expect(stacksAt(ENTRY_SEC + 3)).toBe(2)
    expect(stacksAt(ENTRY_SEC + 5.99)).toBe(2)
    expect(stacksAt(ENTRY_SEC + 6)).toBe(3)
  })

  it("reaches ten stacks at 27 s and never more", () => {
    expect(stacksAt(ENTRY_SEC + 26.9)).toBe(9)
    expect(stacksAt(ENTRY_SEC + 27)).toBe(10)
    expect(stacksAt(ENTRY_SEC + 60)).toBe(10)
  })

  it("lands the boundary on the right side for frames the float grid cannot hit exactly", () => {
    for (const entryFrame of [-7, 13, 1234]) {
      const shifted = engineEnteringCombatAt(script, entryFrame)
      const boundaryFrame = entryFrame + 180
      expect(Math.round(bonusAt(shifted, (boundaryFrame - 1) / FPS, statKey) * 100)).toBe(1)
      expect(Math.round(bonusAt(shifted, boundaryFrame / FPS, statKey) * 100)).toBe(2)
    }
  })

  it("counts from a combat entry before the pull", () => {
    const earlyEntry = engineEnteringCombatAt(script, -90)
    expect(Math.round(bonusAt(earlyEntry, 0, statKey) * 100)).toBe(1)
    expect(Math.round(bonusAt(earlyEntry, 1.5, statKey) * 100)).toBe(2)
  })

  it("gives nothing before combat is entered", () => {
    expect(stacksAt(ENTRY_SEC - 0.5)).toBe(0)
    expect(bonusAt(engineEnteringCombatAt(script, null), 5, statKey)).toBe(0)
  })

  it("moves only its own channel", () => {
    const effects = engine().calculateDamageEffects(
      makeSkill("test", { name: "probe" }),
      ENTRY_SEC + 3,
    ).effects
    expect(effects.map((effect) => effect.statKey)).toEqual([statKey])
  })

  it("scores nothing below its breakthrough gate and applies at it", () => {
    const gate = SCRIPT_MIN_BREAKTHROUGH[script]
    expect(gate).toBe(20)
    expect(
      bonusAt(engineEnteringCombatAt(script, ENTRY_FRAME, gate - 1), ENTRY_SEC + 3, statKey),
    ).toBe(0)
    expect(
      bonusAt(engineEnteringCombatAt(script, ENTRY_FRAME, gate), ENTRY_SEC + 3, statKey),
    ).toBeCloseTo(0.02, 12)
  })
})

describe.each(SCRIPTS)("%s — a full run", (script, statKey) => {
  function hitSkill(name: string, frames: number[], patch: Partial<Skill> = {}): Skill {
    return makeSkill(CLASS, {
      name,
      castFrames: Math.max(...frames) + 1,
      hits: frames.map((frame) => makeHit({ frame, physMultiplier: 1, physFixed: 1 })),
      ...patch,
    })
  }

  function damagesOf(skills: Skill[], patch: Partial<Inputs>, skillName: string): number[] {
    const rotation = testRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id })),
    })
    const result = simulateTimeline({
      ...defaultInputs,
      classId: CLASS,
      breakthrough: UNLOCKED_BREAKTHROUGH,
      customSkills: skills,
      activeCustomRotation: rotation,
      ...patch,
    })
    return result
      .timeline!.filter((event) => event.skillName === skillName)
      .sort((left, right) => left.frame - right.frame)
      .map((event) => event.damage)
  }

  const withScript: Partial<Inputs> = {
    combatSettings: { ...defaultCombatSettings(), script },
  }
  const baselineWithStacks = (stacks: number): Partial<Inputs> => ({
    [statKey]: defaultInputs[statKey] + 0.01 * stacks,
  })

  it("scores the entry hit with no stack and a later hit on the same frame with the first", () => {
    const opener = hitSkill("Opener", [0, 0, 179, 180])
    const scripted = damagesOf([opener], withScript, "Opener")
    const stackless = damagesOf([opener], {}, "Opener")
    const oneStack = damagesOf([opener], baselineWithStacks(1), "Opener")
    const twoStacks = damagesOf([opener], baselineWithStacks(2), "Opener")
    expect(scripted[0]).toBeCloseTo(stackless[0], 6)
    expect(scripted[1]).toBeCloseTo(oneStack[1], 6)
    expect(scripted[2]).toBeCloseTo(oneStack[2], 6)
    expect(scripted[3]).toBeCloseTo(twoStacks[3], 6)
    expect(oneStack[1]).toBeGreaterThan(stackless[1])
  })

  it("starts counting at a damaging hit before the pull and scores a hit after it", () => {
    const prePullOpener = makeSkill(CLASS, {
      name: "Pre-pull opener",
      prePull: true,
      castFrames: 120,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const probe = hitSkill("Probe", [0, 60])
    const scripted = damagesOf([prePullOpener, probe], withScript, "Probe")
    const oneStack = damagesOf([prePullOpener, probe], baselineWithStacks(1), "Probe")
    const twoStacks = damagesOf([prePullOpener, probe], baselineWithStacks(2), "Probe")
    expect(scripted[0]).toBeCloseTo(oneStack[0], 6)
    expect(scripted[1]).toBeCloseTo(twoStacks[1], 6)
  })

  it("does not start counting at a skill that deals no damage", () => {
    const buffOnly = makeSkill(CLASS, {
      name: "Buff only",
      castFrames: 600,
      hits: [makeHit({ frame: 0 })],
    })
    const probe = hitSkill("Probe", [0])
    const scripted = damagesOf([buffOnly, probe], withScript, "Probe")
    const stackless = damagesOf([buffOnly, probe], {}, "Probe")
    expect(scripted[0]).toBeCloseTo(stackless[0], 6)
  })
})
