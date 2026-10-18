import { describe, expect, it } from "vitest"
import { buffEngineWith, DEFAULT_QI_BREAK_WINDOW, scriptedQiBar } from "../helpers/qiBars"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { SCRIPT_IDS, SCRIPT_MIN_BREAKTHROUGH } from "../../src/data/skills/buffs/scriptOptions"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { QiBar, type QiReader } from "../../src/engine/qiBar"
import { makeSkill } from "../../src/engine/skill"
import { runEngine } from "../../src/engine/dps"
import { computeSkillDamage, type FormulaContext } from "../../src/engine/formula"
import { buildContext } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings } from "../../src/engine/types"
import type { Inputs, QiBreakWindow, ScriptId } from "../../src/engine/types"

// Scoped to Bellstrike Umbra for the full-rotation magnitude check — see
// CLAUDE.md § "Implemented classes". The gate and channel checks probe the
// buff engine directly and hold for every class alike, since every script
// is `affectsAll`.
const probe = () => makeSkill("test", { name: "probe" })

const LEAD_AND_BREAK = scriptedQiBar(DEFAULT_QI_BREAK_WINDOW)

const UNLOCKED_BREAKTHROUGH = 16
const FIGHT_STATE_SCRIPTS: readonly ScriptId[] = [
  "purewrathScript",
  "wavebornScript",
  "clearfallScript",
]
const TARGET_MAX_HP = 1000

function qiReaderAt(fraction: number): QiReader {
  return { isBroken: () => false, fractionAt: () => fraction, phaseAt: () => "normal" }
}

function scriptEngine(
  script: ScriptId,
  qiReader: QiReader = qiReaderAt(1),
  breakthrough = UNLOCKED_BREAKTHROUGH,
) {
  return buffEngineWith(
    { [script]: true, breakthrough, targetMaxHp: TARGET_MAX_HP },
    GLOBAL_BUFF_DEFS,
    [],
    qiReader,
  )
}

function effectsAtHealthFraction(
  engine: ReturnType<typeof scriptEngine>,
  remainingHealthFraction: number,
) {
  const damageSoFar = TARGET_MAX_HP * (1 - remainingHealthFraction)
  return engine.calculateDamageEffects(probe(), 1, [], damageSoFar).effects
}

describe("script selection — low-Qi scripts ride the declared low-Qi lead and the break", () => {
  it("holds inside the low-Qi lead", () => {
    const engine = scriptEngine("wraithstrikeScript", LEAD_AND_BREAK)
    expect(engine.calculateDamageEffects(probe(), 22).effects).toContainEqual({
      statKey: "critDamageBoost",
      amount: 0.1,
    })
  })

  it("holds inside the break", () => {
    const engine = scriptEngine("wraithstrikeScript", LEAD_AND_BREAK)
    expect(engine.calculateDamageEffects(probe(), 30).effects).toContainEqual({
      statKey: "critDamageBoost",
      amount: 0.1,
    })
  })

  it("does not hold before the low-Qi lead starts", () => {
    const engine = scriptEngine("wraithstrikeScript", LEAD_AND_BREAK)
    expect(engine.calculateDamageEffects(probe(), 10).effects).toEqual([])
  })

  it("does not hold once the break ends", () => {
    const engine = scriptEngine("wraithstrikeScript", LEAD_AND_BREAK)
    expect(engine.calculateDamageEffects(probe(), 40).effects).toEqual([])
  })
})

describe("script selection — one channel each", () => {
  it("Wraithstrike Script moves only the crit channel", () => {
    const engine = scriptEngine("wraithstrikeScript", LEAD_AND_BREAK)
    const effects = engine.calculateDamageEffects(probe(), 30).effects
    expect(effects).toContainEqual({ statKey: "critDamageBoost", amount: 0.1 })
    expect(effects.some((effect) => effect.statKey === "affinityDamageBoost")).toBe(false)
  })

  it("Voidrot Script moves only the affinity channel", () => {
    const engine = scriptEngine("voidrotScript", LEAD_AND_BREAK)
    const effects = engine.calculateDamageEffects(probe(), 30).effects
    expect(effects).toContainEqual({ statKey: "affinityDamageBoost", amount: 0.1 })
    expect(effects.some((effect) => effect.statKey === "critDamageBoost")).toBe(false)
  })

  it("Opportunity Script moves only the crit channel", () => {
    const effects = effectsAtHealthFraction(scriptEngine("opportunityScript"), 0.2)
    expect(effects).toEqual([{ statKey: "critDamageBoost", amount: 0.1 }])
  })

  it("Detachment Script moves only the affinity channel", () => {
    const effects = effectsAtHealthFraction(scriptEngine("detachmentScript"), 0.2)
    expect(effects).toEqual([{ statKey: "affinityDamageBoost", amount: 0.1 }])
  })

  it("Convergence Script moves only the attribute-damage channel", () => {
    const effects = scriptEngine("convergenceScript").calculateDamageEffects(probe(), 1).effects
    expect(effects).toEqual([{ statKey: "attributeDamageBoost", amount: 0.15 }])
  })
})

describe("script selection — target health window", () => {
  it.each([
    ["opportunityScript", "critDamageBoost"],
    ["detachmentScript", "affinityDamageBoost"],
  ] as const)("%s holds at 40% health inclusive and below, never above", (script, statKey) => {
    const engine = scriptEngine(script)
    expect(effectsAtHealthFraction(engine, 0.4)).toEqual([{ statKey, amount: 0.1 }])
    expect(effectsAtHealthFraction(engine, 0.39)).toEqual([{ statKey, amount: 0.1 }])
    expect(effectsAtHealthFraction(engine, 0)).toEqual([{ statKey, amount: 0.1 }])
    expect(effectsAtHealthFraction(engine, 0.41)).toEqual([])
    expect(effectsAtHealthFraction(engine, 1)).toEqual([])
  })

  it("scores nothing on a target without a health pool", () => {
    const engine = buffEngineWith(
      { opportunityScript: true, breakthrough: UNLOCKED_BREAKTHROUGH },
      GLOBAL_BUFF_DEFS,
    )
    expect(engine.calculateDamageEffects(probe(), 1, [], 999_999).effects).toEqual([])
  })
})

describe("script selection — Convergence Script target Qi window", () => {
  const convergence = { statKey: "attributeDamageBoost", amount: 0.15 }
  const effectsAtQiFraction = (fraction: number) =>
    scriptEngine("convergenceScript", qiReaderAt(fraction)).calculateDamageEffects(probe(), 1)
      .effects

  it("holds at 60% Qi inclusive and above, never below", () => {
    expect(effectsAtQiFraction(0.6)).toEqual([convergence])
    expect(effectsAtQiFraction(0.61)).toEqual([convergence])
    expect(effectsAtQiFraction(1)).toEqual([convergence])
    expect(effectsAtQiFraction(0.59)).toEqual([])
    expect(effectsAtQiFraction(0)).toEqual([])
  })

  it("reads the Qi fraction of a real bar at the 60% boundary", () => {
    const bar = new QiBar(
      { max: 800, refill: 800, breakSec: 10, directImmunitySec: 0, takenIndex: 1 },
      60,
    )
    bar.apply(60, 320, "direct")
    expect(bar.fractionAt(2)).toBe(0.6)
    expect(
      scriptEngine("convergenceScript", bar).calculateDamageEffects(probe(), 2).effects,
    ).toEqual([convergence])
    bar.apply(120, 1, "direct")
    expect(
      scriptEngine("convergenceScript", bar).calculateDamageEffects(probe(), 3).effects,
    ).toEqual([])
  })

  it("gives nothing on a target with no Qi bar", () => {
    const noQiBar = new QiBar(
      { max: 0, refill: 0, breakSec: 0, directImmunitySec: 0, takenIndex: 1 },
      60,
    )
    expect(
      scriptEngine("convergenceScript", noQiBar).calculateDamageEffects(probe(), 1).effects,
    ).toEqual([])
  })
})

describe("script selection — Insight Script target health window", () => {
  const insight = { statKey: "allMysticBoost", amount: 0.15 }

  it("holds above 60% health, never at 60% or below", () => {
    const engine = scriptEngine("insightScript")
    expect(effectsAtHealthFraction(engine, 1)).toEqual([insight])
    expect(effectsAtHealthFraction(engine, 0.61)).toEqual([insight])
    expect(effectsAtHealthFraction(engine, 0.6)).toEqual([])
    expect(effectsAtHealthFraction(engine, 0.59)).toEqual([])
    expect(effectsAtHealthFraction(engine, 0)).toEqual([])
  })

  it("reads a target without a health pool as at full health", () => {
    const engine = buffEngineWith(
      { insightScript: true, breakthrough: UNLOCKED_BREAKTHROUGH },
      GLOBAL_BUFF_DEFS,
    )
    expect(engine.calculateDamageEffects(probe(), 1, [], 999_999).effects).toEqual([insight])
  })
})

describe("script selection — Insight Script reaches mystic hits only", () => {
  type Art = Parameters<typeof computeSkillDamage>[0]
  const artOf = (fields: Record<string, unknown>) =>
    ({
      name: "row",
      physMultiplier: 1,
      attributeMultiplier: 1,
      correction: 1,
      weaponOrAttribute: "Sword",
      attributeAttack: "Bellstrike",
      ...fields,
    }) as unknown as Art
  const baseContext = buildContext(defaultInputs)
  const damageWith = (art: Art, patch: Partial<FormulaContext>) =>
    computeSkillDamage(art, { ...baseContext, ...patch }, 1).expectedDamage

  it.each([
    ["a mystic skill", { skillType: "mystic" }],
    [
      "a tick carrying a mystic category",
      { skillType: "sustain", specialTag: "sustain", mysticCategory: "burst" },
    ],
  ])("adds 15 points to the additive pool on %s", (_label, fields) => {
    const art = artOf(fields)
    const withMysticBoost = damageWith(art, { allMysticBoost: 0.15 })
    expect(withMysticBoost).toBeGreaterThan(damageWith(art, { allMysticBoost: 0 }))
    expect(withMysticBoost).toBeCloseTo(
      damageWith(art, { generalDamageBoost: baseContext.generalDamageBoost + 0.15 }),
      9,
    )
  })

  it.each([
    ["a weapon skill", { skillType: "weapon" }],
    ["a weapon bleed tick", { skillType: "sustain", specialTag: "sustain" }],
  ])("adds nothing on %s", (_label, fields) => {
    const art = artOf(fields)
    expect(damageWith(art, { allMysticBoost: 0.15 })).toBe(damageWith(art, { allMysticBoost: 0 }))
  })
})

describe.each([
  ["voidskyScript", "critDamageBoost"],
  ["soullinkScript", "affinityDamageBoost"],
] as const)("script selection — %s stacks", (script, statKey) => {
  const stacksAt = (engine: ReturnType<typeof scriptEngine>, time: number) =>
    engine
      .calculateDamageEffects(probe(), time)
      .effects.find((effect) => effect.statKey === statKey)?.amount ?? 0
  const stackEngine = () => scriptEngine(script, qiReaderAt(1), SCRIPT_MIN_BREAKTHROUGH[script])
  const hit = (
    engine: ReturnType<typeof scriptEngine>,
    time: number,
    kind: "hit" | "tick" = "hit",
  ) => engine.processDamageHitPreScore(time, probe(), kind)

  it("starts at zero stacks", () => {
    expect(stacksAt(stackEngine(), 0)).toBe(0)
  })

  it("counts the granting hit and gains one stack per 60 s of hits", () => {
    const engine = stackEngine()
    hit(engine, 10)
    expect(stacksAt(engine, 10)).toBeCloseTo(0.035, 12)
    hit(engine, 20)
    hit(engine, 69.9)
    expect(stacksAt(engine, 69.9)).toBeCloseTo(0.035, 12)
    hit(engine, 70)
    expect(stacksAt(engine, 70)).toBeCloseTo(0.07, 12)
    hit(engine, 129.9)
    expect(stacksAt(engine, 129.9)).toBeCloseTo(0.07, 12)
    hit(engine, 130)
    expect(stacksAt(engine, 130)).toBeCloseTo(0.105, 12)
  })

  it("caps at three stacks", () => {
    const engine = stackEngine()
    for (const time of [0, 60, 120, 180, 240]) hit(engine, time)
    expect(stacksAt(engine, 240)).toBeCloseTo(0.105, 12)
  })

  it("keeps every stack until a gain refreshes them, then drops them together", () => {
    const engine = stackEngine()
    hit(engine, 0)
    hit(engine, 60)
    expect(stacksAt(engine, 179.9)).toBeCloseTo(0.07, 12)
    expect(stacksAt(engine, 180)).toBe(0)
  })

  it("drops all stacks 120 s after the last gain without hits", () => {
    const engine = stackEngine()
    hit(engine, 0)
    hit(engine, 60)
    hit(engine, 120)
    expect(stacksAt(engine, 239.9)).toBeCloseTo(0.105, 12)
    expect(stacksAt(engine, 240)).toBe(0)
  })

  it("gains from damage-over-time ticks", () => {
    const engine = stackEngine()
    hit(engine, 5, "tick")
    expect(stacksAt(engine, 5)).toBeCloseTo(0.035, 12)
  })

  it("scores nothing below its breakthrough gate", () => {
    const engine = scriptEngine(script, qiReaderAt(1), SCRIPT_MIN_BREAKTHROUGH[script] - 1)
    hit(engine, 0)
    expect(stacksAt(engine, 0)).toBe(0)
  })
})

describe("script selection — exactly one active", () => {
  function inputsWith(script: ScriptId): Inputs {
    return { ...defaultInputs, combatSettings: { ...defaultCombatSettings(), script } }
  }

  it.each(SCRIPT_IDS)("selecting %s turns every other script's gate off", (selected) => {
    const params = paramsFromInputs(inputsWith(selected))
    for (const script of SCRIPT_IDS) {
      if (script === selected) expect(params[script]).toBe(true)
      else expect(params[script]).toBeUndefined()
    }
  })

  it("switching the selection replaces the previous script instead of adding to it", () => {
    const withWraith = paramsFromInputs(inputsWith("wraithstrikeScript"))
    expect(withWraith.wraithstrikeScript).toBe(true)
    expect(withWraith.voidrotScript).toBeUndefined()

    const withVoidrot = paramsFromInputs(inputsWith("voidrotScript"))
    expect(withVoidrot.voidrotScript).toBe(true)
    expect(withVoidrot.wraithstrikeScript).toBeUndefined()
  })
})

describe("script selection — unlocked by breakthrough", () => {
  const STACKING_SCRIPTS: readonly ScriptId[] = ["voidskyScript", "soullinkScript"]
  const EMPTY_EFFECT_SCRIPTS: readonly ScriptId[] = ["karmaScript", "chaosScript"]
  const GATED_SCRIPTS = SCRIPT_IDS.filter(
    (script) => !EMPTY_EFFECT_SCRIPTS.includes(script) && !FIGHT_STATE_SCRIPTS.includes(script),
  )

  const conditionMetEffects = (script: ScriptId, breakthrough: number) => {
    const engine = scriptEngine(
      script,
      qiReaderAt(script === "convergenceScript" ? 1 : 0),
      breakthrough,
    )
    if (STACKING_SCRIPTS.includes(script)) engine.processDamageHitPreScore(1, probe())
    const damageSoFar = script === "insightScript" ? 0 : TARGET_MAX_HP
    return engine.calculateDamageEffects(probe(), 1, [], damageSoFar).effects
  }

  it.each(GATED_SCRIPTS)("%s scores nothing below its gate and applies at it", (script) => {
    const gate = SCRIPT_MIN_BREAKTHROUGH[script]
    expect(conditionMetEffects(script, gate - 1)).toEqual([])
    expect(conditionMetEffects(script, gate)).toHaveLength(1)
    expect(conditionMetEffects(script, gate + 1)).toHaveLength(1)
  })

  it.each(EMPTY_EFFECT_SCRIPTS)(
    "%s scores nothing on a training stake at any breakthrough",
    (script) => {
      for (const breakthrough of [
        1,
        SCRIPT_MIN_BREAKTHROUGH[script] - 1,
        SCRIPT_MIN_BREAKTHROUGH[script],
        25,
      ])
        expect(conditionMetEffects(script, breakthrough)).toEqual([])
    },
  )

  it.each(EMPTY_EFFECT_SCRIPTS)("%s shows no buff chip at breakthrough 20", (script) => {
    const engine = scriptEngine(script, qiReaderAt(1), 20)
    expect(engine.activeBuffsForDisplay(1).map((chip) => chip.id)).not.toContain(script)
  })

  it("gates each script at its breakthrough", () => {
    expect(SCRIPT_MIN_BREAKTHROUGH).toEqual({
      opportunityScript: 14,
      detachmentScript: 14,
      insightScript: 14,
      wraithstrikeScript: 16,
      voidrotScript: 16,
      convergenceScript: 16,
      voidskyScript: 18,
      soullinkScript: 18,
      purewrathScript: 18,
      karmaScript: 20,
      chaosScript: 20,
      wavebornScript: 20,
      clearfallScript: 20,
    })
  })

  it.each(SCRIPT_IDS)("%s stays selected in the saved settings below its gate", (script) => {
    const belowGate: Inputs = {
      ...defaultInputs,
      breakthrough: SCRIPT_MIN_BREAKTHROUGH[script] - 1,
      combatSettings: { ...defaultCombatSettings(), script },
    }
    const params = paramsFromInputs(belowGate)
    expect(belowGate.combatSettings!.script).toBe(script)
    expect(params[script]).toBe(true)
    expect(params.breakthrough).toBe(belowGate.breakthrough)
  })
})

function inputsWithScript(script: ScriptId | null): Inputs {
  return {
    ...defaultInputs,
    breakthrough: UNLOCKED_BREAKTHROUGH,
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
    const baseline = runEngine({
      ...defaultInputs,
      breakthrough: UNLOCKED_BREAKTHROUGH,
    }).totalDamage
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

  it("scores nothing below the script's breakthrough gate", () => {
    const options = { fixedQiBreaks: [UMBRA_DEFAULT_QI_BREAK] }
    const belowGate = { ...inputsWithScript("wraithstrikeScript"), breakthrough: 15 }
    const none = runEngine({ ...belowGate, combatSettings: defaultCombatSettings() }, options)
    const wraith = runEngine(belowGate, options)
    expect(wraith.totalDamage).toBeCloseTo(none.totalDamage, 6)
  })
})
