// Mechanics, sources, and coefficient provenance:
// src/data/skills/universal/dragon-head.md.
//
// Damage assertions scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { computeSkillDamage } from "../../src/engine/formula"
import type { FormulaContext } from "../../src/engine/formula"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings } from "../../src/engine/types"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import type { Inputs } from "../../src/engine/types"

const ALL_CLASS_IDS = [
  "bellstrikeUmbra",
  "bellstrikeRainbow",
  "silkbindJade",
  "stonesplitPower",
  "stonesplitBalancePureTang",
  "bamboocutDust",
  "bamboocutWindTwinblade",
  "stonesplitBalanceDualCut",
]

describe("Dragon Head registry — universal mystic, both versions", () => {
  it("every class exposes both versions with the workbook coefficients", () => {
    for (const classId of ALL_CLASS_IDS) {
      const skills = builtinSkillsForClass(classId)
      const base = skills.find((s) => s.name === "Dragon Head")
      const plus = skills.find((s) => s.name === "Dragon Head - Plus")
      expect(base, classId).toBeTruthy()
      expect(plus, classId).toBeTruthy()
      expect(base!.id).toBe(`${classId}-dragon-head`)
      expect(plus!.id).toBe(`${classId}-dragon-head-plus`)
      expect(base!.skillType).toBe("mystic")
      expect(plus!.skillType).toBe("mystic")
      expect(base!.tags).toContain("mystic:burst")
      expect(plus!.tags).toContain("mystic:burst")
      expect(base!.guaranteedNormal).toBe(true)
      expect(plus!.guaranteedPrecision).toBe(true)

      const baseHit = base!.hits[0]
      const plusHit = plus!.hits[0]
      expect(plusHit.physMultiplier).toBeCloseTo(17.3793, 9)
      expect(plusHit.attributeMultiplier).toBeCloseTo(26.0689, 9)
      expect(plusHit.physFixed).toBeCloseTo(3237, 9)
      expect(plusHit.physMultiplier).toBeCloseTo(baseHit.physMultiplier * 0.7, 4)
      expect(plusHit.attributeMultiplier).toBeCloseTo(baseHit.attributeMultiplier * 0.7, 4)
      expect(plusHit.physFixed).toBeCloseTo(baseHit.physFixed * 0.7, 4)
    }
  })

  it("Surging Waves is a global buff def: 8 stacks/cast of the Plus, +1.25 %/stack, max 40, gated to Dragon Head", () => {
    const surgingWaves = GLOBAL_BUFF_DEFS.find((d) => d.id === "surgingWaves")
    expect(surgingWaves).toBeTruthy()
    expect(surgingWaves!.triggeredBy).toEqual(["Dragon Head - Plus"])
    expect(surgingWaves!.stacksPerCast).toBe(8)
    expect(surgingWaves!.maxStacks).toBe(40)
    expect(surgingWaves!.duration).toBe(6)
    expect(surgingWaves!.affects).toEqual(["Dragon Head"])
    expect(surgingWaves!.bonus).toEqual({ type: "buffBonus", valuePerStack: 0.0125 })
  })
})

type Art = Parameters<typeof computeSkillDamage>[0]
const art_ = (a: Record<string, unknown>) => a as unknown as Art
const slots = ["N/A", "N/A", "N/A", "N/A", "N/A"] as const

const DRAGON_HEAD_ROW = {
  physMultiplier: 24.827571,
  physFixed: 4624.285714,
  attributeMultiplier: 37.241286,
  attributeFixed: 0,
  skillType: "mystic",
  mysticCategory: "burst",
  attributeAttack: "Bellstrike",
}

const ctx: FormulaContext = {
  smallPhys: 1043,
  largePhys: 2006,
  outerPen: 29.2,
  bellstrike: { min: 352, max: 502, pen: 21.2 },
  stonesplit: { min: 0, max: 0, pen: 0 },
  silkbind: { min: 0, max: 0, pen: 0 },
  bamboocut: { min: 0, max: 0, pen: 0 },
  primaryAttribute: "Bellstrike",
  attributePrimaryBonus: 34,
  precisionPanel: 0.9,
  critPanel: 0.5,
  affinityPanel: 0.2,
  directCritPanel: 0,
  directAffinityPanel: 0,
  physDmgBoostPanel: 0,
  critDmgBoostPanel: 0.579,
  affinityDmgBoostPanel: 0.35,
  attributeDmgBoostPanel: 0.076,
  sustainDmgBoostPanel: 0,
  generalDamageBoost: 0,
  chargeBonus: 0,
  effectiveDefense: 307,
  fatigueDamageTaken: 0,
  hasSixHenZhi: false,
  food: false,
  set: null,
  tianGong: null,
  dingYinByTag: { "DingYin 1": 0, "DingYin 2": 0, "DingYin 3": 0 },
  shareDebuffs: { henZhi: false, easyHurt: false },
}

describe("guaranteedNormal — fixed damage, immune to every rate", () => {
  const fixed = art_({ name: "Dragon Head", ...DRAGON_HEAD_ROW, guaranteedNormal: 1 })
  const normal = art_({ name: "Dragon Head (unflagged)", ...DRAGON_HEAD_ROW })

  it("expected damage equals the normal row (EF), not the rate-weighted mix", () => {
    const result = computeSkillDamage(fixed, slots, ctx, 1)
    expect(result.expectedDamage).toBeCloseTo(result.cells.EF, 6)
    const unflagged = computeSkillDamage(normal, slots, ctx, 1)
    expect(unflagged.expectedDamage).toBeCloseTo(unflagged.cells.EH, 6)
    expect(result.expectedDamage).not.toBeCloseTo(unflagged.expectedDamage, 0)
  })

  it("crit, affinity and precision rates do not move it", () => {
    const base = computeSkillDamage(fixed, slots, ctx, 1).expectedDamage
    const ratesUp = computeSkillDamage(
      fixed,
      slots,
      { ...ctx, critPanel: 0.8, affinityPanel: 0.4, precisionPanel: 0.5 },
      1,
    ).expectedDamage
    expect(ratesUp).toBeCloseTo(base, 6)
  })
})

describe("guaranteedPrecision — never abrades, crit/affinity still roll", () => {
  const plus = art_({
    name: "Dragon Head - Plus",
    ...DRAGON_HEAD_ROW,
    physMultiplier: 17.3793,
    physFixed: 3237,
    attributeMultiplier: 26.0689,
    guaranteedPrecision: 1,
  })

  it("U is 1 and the abrasion weight AL is 0 even at low panel precision", () => {
    const c = computeSkillDamage(plus, slots, { ...ctx, precisionPanel: 0.5 }, 1).cells
    expect(c.U).toBe(1)
    expect(c.AL).toBe(0)
  })

  it("lowering precision does not lower it, but does lower the unflagged variant", () => {
    const lowPrecision = { ...ctx, precisionPanel: 0.5 }
    const flagged = computeSkillDamage(plus, slots, lowPrecision, 1).expectedDamage
    expect(flagged).toBeCloseTo(computeSkillDamage(plus, slots, ctx, 1).expectedDamage, 6)

    const unflagged = art_({ ...plus, guaranteedPrecision: undefined })
    const unflaggedLow = computeSkillDamage(unflagged, slots, lowPrecision, 1).expectedDamage
    const unflaggedBase = computeSkillDamage(unflagged, slots, ctx, 1).expectedDamage
    expect(unflaggedLow).toBeLessThan(unflaggedBase)
  })

  it("raising crit rate still raises it", () => {
    const base = computeSkillDamage(plus, slots, ctx, 1).expectedDamage
    const highCrit = computeSkillDamage(plus, slots, { ...ctx, critPanel: 0.8 }, 1).expectedDamage
    expect(highCrit).toBeGreaterThan(base)
  })
})

function rotationOf(classId: string, skillNames: string[]) {
  const skills = builtinSkillsForClass(classId)
  const steps = skillNames.map((name) => {
    const skill = skills.find((s) => s.name === name)
    if (!skill) throw new Error(`no built-in skill "${name}" for ${classId}`)
    return makeStep({ skillId: skill.id, hitCount: skill.hits.length })
  })
  return makeRotation(classId, { name: `test-${skillNames.join("+")}`, steps })
}

function simulate(skillNames: string[], overrides: Partial<Inputs> = {}) {
  const inputs: Inputs = {
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    activeCustomRotation: rotationOf("bellstrikeUmbra", skillNames),
    ...overrides,
  }
  return simulateTimeline(inputs)
}

function withFullStacks(): Partial<Inputs> {
  return {
    combatSettings: { ...defaultCombatSettings(), dragonHeadFullStacks: true },
  }
}

function skillDamage(result: ReturnType<typeof simulateTimeline>, name: string): number {
  return result.perSkill
    .filter((p) => p.name === name)
    .reduce((sum, p) => sum + p.expectedDamage, 0)
}

describe("Surging Waves in the timeline (Bellstrike Umbra)", () => {
  it("a second Plus cast inside the 6 s window is boosted by the first cast's stacks", () => {
    const oneCast = skillDamage(simulate(["Dragon Head - Plus"]), "Dragon Head - Plus")
    const twoCasts = skillDamage(
      simulate(["Dragon Head - Plus", "Dragon Head - Plus"]),
      "Dragon Head - Plus",
    )
    expect(oneCast).toBeGreaterThan(0)
    // cast 1 lands at 8 stacks, cast 2 at 16 — the pair outdamages 2 independent casts
    expect(twoCasts).toBeGreaterThan(2 * oneCast)
  })

  it("Surging Waves does not leak onto other skills", () => {
    const alone = skillDamage(simulate(["Sword Martial Q"]), "Sword Martial Q")
    const afterPlus = skillDamage(
      simulate(["Dragon Head - Plus", "Sword Martial Q"]),
      "Sword Martial Q",
    )
    expect(afterPlus).toBeCloseTo(alone, 6)
  })

  it("the base version's timeline damage ignores precision", () => {
    const base = simulate(["Dragon Head"])
    const lowPrecision = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      precision: 0.7,
      activeCustomRotation: rotationOf("bellstrikeUmbra", ["Dragon Head"]),
    })
    expect(skillDamage(base, "Dragon Head")).toBeGreaterThan(0)
    expect(skillDamage(lowPrecision, "Dragon Head")).toBeCloseTo(
      skillDamage(base, "Dragon Head"),
      6,
    )
  })
})

describe("40 Stacks (Dragon Head) teammate buff", () => {
  const surgingWavesStacks = (result: ReturnType<typeof simulateTimeline>) =>
    (result.casts ?? []).map((c) => c.buffs.find((b) => b.id === "surgingWaves")?.stacks ?? 0)

  it("holds every cast at the 40-stack cap instead of climbing 8 at a time", () => {
    const fiveCasts = Array(5).fill("Dragon Head - Plus")
    const selfOnly = surgingWavesStacks(simulate(fiveCasts))
    expect(selfOnly[0]).toBeLessThan(40)
    expect(selfOnly).toEqual([...selfOnly].sort((left, right) => left - right))
    expect(surgingWavesStacks(simulate(fiveCasts, withFullStacks()))).toEqual([40, 40, 40, 40, 40])
  })

  it("raises the first cast's damage over the self-only 8 stacks", () => {
    const selfOnly = skillDamage(simulate(["Dragon Head - Plus"]), "Dragon Head - Plus")
    const withAllies = skillDamage(
      simulate(["Dragon Head - Plus"], withFullStacks()),
      "Dragon Head - Plus",
    )
    expect(withAllies).toBeGreaterThan(selfOnly)
  })

  it("leaves other skills untouched", () => {
    const alone = skillDamage(simulate(["Sword Martial Q"]), "Sword Martial Q")
    const afterPlus = skillDamage(
      simulate(["Dragon Head - Plus", "Sword Martial Q"], withFullStacks()),
      "Sword Martial Q",
    )
    expect(afterPlus).toBeCloseTo(alone, 6)
  })
})

describe("Max Low-HP Bonus (Dragon Head)", () => {
  const withLowHp = (): Partial<Inputs> => ({
    combatSettings: { ...defaultCombatSettings(), dragonHeadLowHpMaxBonus: true },
  })

  it("is a global buff def applying the sourced 45 % cap, gated to the Plus", () => {
    const def = GLOBAL_BUFF_DEFS.find((d) => d.id === "dragonHeadLowHp")
    expect(def).toBeTruthy()
    expect(def!.bonus).toEqual({ type: "buffBonus", value: 0.45 })
    expect(def!.affects).toEqual(["Dragon Head - Plus"])
    expect(def!.enabledParam).toBe("dragonHeadLowHpMaxBonus")
    expect(def!.alwaysActive).toBe(true)
  })

  it("does nothing until the toggle is on", () => {
    const plain = skillDamage(simulate(["Dragon Head - Plus"]), "Dragon Head - Plus")
    const boosted = skillDamage(simulate(["Dragon Head - Plus"], withLowHp()), "Dragon Head - Plus")
    expect(boosted).toBeGreaterThan(plain)
  })

  // Cross-checked against Revelry Script, a known +0.30 into the same additive
  // pool: it fixes the pool size independently, which then predicts the 0.45.
  it("adds exactly 0.45 to the same additive pool Revelry Script feeds", () => {
    const withRevelry = (): Partial<Inputs> => ({
      combatSettings: { ...defaultCombatSettings(), revelryScript: true },
    })
    const plain = skillDamage(simulate(["Dragon Head - Plus"]), "Dragon Head - Plus")
    const revelry = skillDamage(
      simulate(["Dragon Head - Plus"], withRevelry()),
      "Dragon Head - Plus",
    )
    const lowHp = skillDamage(simulate(["Dragon Head - Plus"], withLowHp()), "Dragon Head - Plus")

    const pool = 0.3 / (revelry / plain - 1)
    expect(lowHp / plain).toBeCloseTo((pool + 0.45) / pool, 9)
  })

  it("does not touch the base version or any other skill", () => {
    for (const name of ["Dragon Head", "Sword Martial Q"]) {
      const alone = skillDamage(simulate([name]), name)
      const withBonus = skillDamage(simulate([name], withLowHp()), name)
      expect(withBonus, name).toBeCloseTo(alone, 6)
    }
  })
})

describe("Dragon Head - Plus doubles into a depleted-Qi target", () => {
  const qiBreak = (enabled: boolean, startSec: number): Partial<Inputs> => ({
    combatSettings: {
      ...defaultCombatSettings(),
      qiBreak: { enabled, startSec, durationSec: 10 },
    },
  })

  // the cast is 246 frames, so a break opening at 0 s still covers the hit
  const insideBreak = qiBreak(true, 0)
  const outsideBreak = qiBreak(true, 60)

  it("carries the tag on every class's built-in Plus, and never on the base version", () => {
    for (const classId of ALL_CLASS_IDS) {
      const skills = builtinSkillsForClass(classId)
      const plus = skills.find((s) => s.name === "Dragon Head - Plus")!
      const base = skills.find((s) => s.name === "Dragon Head")!
      expect(plus.tags, classId).toContain("prop:hasQiBreakDoubleDamage")
      expect(base.tags, classId).not.toContain("prop:hasQiBreakDoubleDamage")
    }
  })

  // Same id, so it replaces the built-in wholesale: identical name, hits and
  // buff triggers, differing only by the tag. Comparing against the window's
  // pre-existing +10 % boost instead would not isolate the doubling.
  const withoutTheTag = (): Inputs["customSkills"] => {
    const plus = builtinSkillsForClass("bellstrikeUmbra").find(
      (s) => s.name === "Dragon Head - Plus",
    )!
    return [{ ...plus, tags: (plus.tags ?? []).filter((t) => t !== "prop:hasQiBreakDoubleDamage") }]
  }

  it("is worth exactly x2 inside the window", () => {
    const tagged = skillDamage(simulate(["Dragon Head - Plus"], insideBreak), "Dragon Head - Plus")
    const untagged = skillDamage(
      simulate(["Dragon Head - Plus"], { ...insideBreak, customSkills: withoutTheTag() }),
      "Dragon Head - Plus",
    )
    expect(tagged / untagged).toBeCloseTo(2, 9)
  })

  it("changes nothing outside the window", () => {
    const tagged = skillDamage(simulate(["Dragon Head - Plus"], outsideBreak), "Dragon Head - Plus")
    const untagged = skillDamage(
      simulate(["Dragon Head - Plus"], { ...outsideBreak, customSkills: withoutTheTag() }),
      "Dragon Head - Plus",
    )
    expect(tagged).toBeCloseTo(untagged, 6)
  })

  it("does not double when the Qi Break Window toggle is off", () => {
    const off = skillDamage(
      simulate(["Dragon Head - Plus"], qiBreak(false, 0)),
      "Dragon Head - Plus",
    )
    const outside = skillDamage(
      simulate(["Dragon Head - Plus"], outsideBreak),
      "Dragon Head - Plus",
    )
    expect(off).toBeCloseTo(outside, 6)
  })

  it("does not double the base version, which only gets the window's boost", () => {
    const outside = skillDamage(simulate(["Dragon Head"], outsideBreak), "Dragon Head")
    const inside = skillDamage(simulate(["Dragon Head"], insideBreak), "Dragon Head")
    expect(inside).toBeGreaterThan(outside)
    expect(inside / outside).toBeLessThan(1.5)
  })
})
