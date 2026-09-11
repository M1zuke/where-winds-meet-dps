import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { makeSkill } from "../../src/engine/skill"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings } from "../../src/engine/types"
import type { CombatSettings, Inputs, ScriptId } from "../../src/engine/types"

// Scoped to Bellstrike Umbra for the full-rotation magnitude check — see
// CLAUDE.md § "Implemented classes". The gate and channel checks probe the
// buff engine directly and hold for every class alike, since both scripts
// are `affectsAll`.
const probe = () => makeSkill("test", { name: "probe" })

// The low-Qi lead only exists once a `belowQiTime` is declared — mirroring
// `paramsFromInputs`, which derives it from the rotation's lead-in seconds.
// With it: normal below 20s, the declared lead from 20-25s, exhausted (the
// break) 25-35s, normal again after — the engine's stand-in for "target Qi
// below 40%" (see clockQiPhase).
const LEAD_AND_BREAK_PARAMS = { belowQiTime: 20 }

describe("script selection — rides the declared low-Qi lead and the break, because the engine models no Qi bar", () => {
  it("holds inside the low-Qi lead", () => {
    const engine = new BuffEngine(
      { wraithstrikeScript: true, ...LEAD_AND_BREAK_PARAMS },
      GLOBAL_BUFF_DEFS,
    )
    expect(engine.calculateDamageEffects(probe(), 22).effects).toContainEqual({
      statKey: "critDamageBoost",
      amount: 0.1,
    })
  })

  it("holds inside the break", () => {
    const engine = new BuffEngine(
      { wraithstrikeScript: true, ...LEAD_AND_BREAK_PARAMS },
      GLOBAL_BUFF_DEFS,
    )
    expect(engine.calculateDamageEffects(probe(), 30).effects).toContainEqual({
      statKey: "critDamageBoost",
      amount: 0.1,
    })
  })

  it("does not hold before the low-Qi lead starts", () => {
    const engine = new BuffEngine(
      { wraithstrikeScript: true, ...LEAD_AND_BREAK_PARAMS },
      GLOBAL_BUFF_DEFS,
    )
    expect(engine.calculateDamageEffects(probe(), 10).effects).toEqual([])
  })

  it("does not hold once the break ends", () => {
    const engine = new BuffEngine(
      { wraithstrikeScript: true, ...LEAD_AND_BREAK_PARAMS },
      GLOBAL_BUFF_DEFS,
    )
    expect(engine.calculateDamageEffects(probe(), 40).effects).toEqual([])
  })
})

describe("script selection — one channel each", () => {
  it("Wraithstrike Script moves only the crit channel", () => {
    const engine = new BuffEngine(
      { wraithstrikeScript: true, ...LEAD_AND_BREAK_PARAMS },
      GLOBAL_BUFF_DEFS,
    )
    const effects = engine.calculateDamageEffects(probe(), 30).effects
    expect(effects).toContainEqual({ statKey: "critDamageBoost", amount: 0.1 })
    expect(effects.some((effect) => effect.statKey === "affinityDamageBoost")).toBe(false)
  })

  it("Voidrot Script moves only the affinity channel", () => {
    const engine = new BuffEngine(
      { voidrotScript: true, ...LEAD_AND_BREAK_PARAMS },
      GLOBAL_BUFF_DEFS,
    )
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

function inputsWithScript(
  script: ScriptId | null,
  combatOverrides: Partial<CombatSettings> = {},
): Inputs {
  return {
    ...defaultInputs,
    combatSettings: { ...defaultCombatSettings(), ...combatOverrides, script },
  }
}

describe("script selection — end to end on the class default rotation", () => {
  it("selecting a script raises total damage; selecting none changes nothing", () => {
    const baseline = runEngine(defaultInputs).totalDamage
    const none = runEngine(inputsWithScript(null)).totalDamage
    const wraith = runEngine(inputsWithScript("wraithstrikeScript")).totalDamage
    expect(none).toBeCloseTo(baseline, 6)
    expect(wraith).toBeGreaterThan(none)
  })

  it("changes nothing when the rotation's Qi break window has no length", () => {
    const zeroBreak = { qiBreakOverride: { startSec: 0, durationSec: 0, lowQiLeadSec: 0 } }
    const none = runEngine(inputsWithScript(null, zeroBreak)).totalDamage
    const wraith = runEngine(inputsWithScript("wraithstrikeScript", zeroBreak)).totalDamage
    expect(wraith).toBeCloseTo(none, 6)
  })

  // Calibration for the default break-25s/lead-20s window: a +0.10 crit-damage
  // script is worth roughly +1%, far short of the +4.7% an unconditional grant
  // would be — landing near the unconditional figure means the gate isn't
  // being applied.
  it("lands near the calibrated ~1% magnitude, not the unconditional +10% grant", () => {
    const none = runEngine(inputsWithScript(null)).totalDamage
    const wraith = runEngine(inputsWithScript("wraithstrikeScript")).totalDamage
    const lift = wraith / none - 1
    expect(lift).toBeGreaterThan(0.002)
    expect(lift).toBeLessThan(0.02)
  })
})
