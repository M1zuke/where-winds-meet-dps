import { describe, expect, it } from "vitest"
import { buffEngineWith, DEFAULT_QI_BREAK_WINDOW, scriptedQiBar } from "../helpers/qiBars"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { makeSkill } from "../../src/engine/skill"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings } from "../../src/engine/types"
import type { Inputs, QiBreakWindow, ScriptId } from "../../src/engine/types"

// Scoped to Bellstrike Umbra for the full-rotation magnitude check — see
// CLAUDE.md § "Implemented classes". The gate and channel checks probe the
// buff engine directly and hold for every class alike, since both scripts
// are `affectsAll`.
const probe = () => makeSkill("test", { name: "probe" })

const LEAD_AND_BREAK = scriptedQiBar(DEFAULT_QI_BREAK_WINDOW)

describe("script selection — rides the declared low-Qi lead and the break, because the engine models no Qi bar", () => {
  it("holds inside the low-Qi lead", () => {
    const engine = buffEngineWith(
      { wraithstrikeScript: true },
      GLOBAL_BUFF_DEFS,
      [],
      LEAD_AND_BREAK,
    )
    expect(engine.calculateDamageEffects(probe(), 22).effects).toContainEqual({
      statKey: "critDamageBoost",
      amount: 0.1,
    })
  })

  it("holds inside the break", () => {
    const engine = buffEngineWith(
      { wraithstrikeScript: true },
      GLOBAL_BUFF_DEFS,
      [],
      LEAD_AND_BREAK,
    )
    expect(engine.calculateDamageEffects(probe(), 30).effects).toContainEqual({
      statKey: "critDamageBoost",
      amount: 0.1,
    })
  })

  it("does not hold before the low-Qi lead starts", () => {
    const engine = buffEngineWith(
      { wraithstrikeScript: true },
      GLOBAL_BUFF_DEFS,
      [],
      LEAD_AND_BREAK,
    )
    expect(engine.calculateDamageEffects(probe(), 10).effects).toEqual([])
  })

  it("does not hold once the break ends", () => {
    const engine = buffEngineWith(
      { wraithstrikeScript: true },
      GLOBAL_BUFF_DEFS,
      [],
      LEAD_AND_BREAK,
    )
    expect(engine.calculateDamageEffects(probe(), 40).effects).toEqual([])
  })
})

describe("script selection — one channel each", () => {
  it("Wraithstrike Script moves only the crit channel", () => {
    const engine = buffEngineWith(
      { wraithstrikeScript: true },
      GLOBAL_BUFF_DEFS,
      [],
      LEAD_AND_BREAK,
    )
    const effects = engine.calculateDamageEffects(probe(), 30).effects
    expect(effects).toContainEqual({ statKey: "critDamageBoost", amount: 0.1 })
    expect(effects.some((effect) => effect.statKey === "affinityDamageBoost")).toBe(false)
  })

  it("Voidrot Script moves only the affinity channel", () => {
    const engine = buffEngineWith({ voidrotScript: true }, GLOBAL_BUFF_DEFS, [], LEAD_AND_BREAK)
    const effects = engine.calculateDamageEffects(probe(), 30).effects
    expect(effects).toContainEqual({ statKey: "affinityDamageBoost", amount: 0.1 })
    expect(effects.some((effect) => effect.statKey === "critDamageBoost")).toBe(false)
  })
})

describe("script selection — exactly one active", () => {
  it("switching the selection turns the previous script's gate off instead of adding to it", () => {
    const withWraith: Inputs = {
      ...defaultInputs,
      combatSettings: { ...defaultCombatSettings(), script: "wraithstrikeScript" },
    }
    const wraithParams = paramsFromInputs(withWraith)
    expect(wraithParams.wraithstrikeScript).toBe(true)
    expect(wraithParams.voidrotScript).toBeUndefined()

    const withVoidrot: Inputs = {
      ...withWraith,
      combatSettings: { ...withWraith.combatSettings!, script: "voidrotScript" },
    }
    const voidrotParams = paramsFromInputs(withVoidrot)
    expect(voidrotParams.voidrotScript).toBe(true)
    expect(voidrotParams.wraithstrikeScript).toBeUndefined()
  })
})

function inputsWithScript(script: ScriptId | null): Inputs {
  return {
    ...defaultInputs,
    combatSettings: { ...defaultCombatSettings(), script },
  }
}

// A fixed 34 s break, pinned as an explicit fixed schedule so
// this magnitude check stays a fixed-window fact rather than riding a bare,
// unbuilt `defaultInputs` character's own simulated schedule, which
// (correctly) may never reach a break at all.
const UMBRA_DEFAULT_QI_BREAK: QiBreakWindow = { startSec: 34, durationSec: 10, lowQiLeadSec: 5 }

describe("script selection — end to end on the class default rotation", () => {
  it("selecting a script raises total damage; selecting none changes nothing", () => {
    const baseline = runEngine(defaultInputs).totalDamage
    const none = runEngine(inputsWithScript(null)).totalDamage
    expect(none).toBeCloseTo(baseline, 6)

    const options = { fixedQiBreaks: [UMBRA_DEFAULT_QI_BREAK] }
    const noneWithBreak = runEngine(inputsWithScript(null), options).totalDamage
    const wraith = runEngine(inputsWithScript("wraithstrikeScript"), options).totalDamage
    expect(wraith).toBeGreaterThan(noneWithBreak)
  })

  it("changes nothing when the Qi break window has no length", () => {
    const options = { fixedQiBreaks: [{ startSec: 0, durationSec: 0, lowQiLeadSec: 0 }] }
    const none = runEngine(inputsWithScript(null), options).totalDamage
    const wraith = runEngine(inputsWithScript("wraithstrikeScript"), options).totalDamage
    expect(wraith).toBeCloseTo(none, 6)
  })

  // Calibration for the fixed break-34s/lead-5s window: a
  // +0.10 crit-damage script is worth roughly +1%, far short of the +4.7% an
  // unconditional grant would be — landing near the unconditional figure
  // means the gate isn't being applied.
  it("lands near the calibrated ~1% magnitude, not the unconditional +10% grant", () => {
    const options = { fixedQiBreaks: [UMBRA_DEFAULT_QI_BREAK] }
    const none = runEngine(inputsWithScript(null), options).totalDamage
    const wraith = runEngine(inputsWithScript("wraithstrikeScript"), options).totalDamage
    const lift = wraith / none - 1
    expect(lift).toBeGreaterThan(0.002)
    expect(lift).toBeLessThan(0.02)
  })
})
