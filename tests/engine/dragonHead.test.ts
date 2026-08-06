// Mechanics, sources, and coefficient provenance:
// src/data/skills/universal/dragon-head.md.
//
// Damage assertions scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { computeSkillDamage } from "../../src/engine/formula"
import type { FormulaContext } from "../../src/engine/formula"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
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
      expect(plusHit.physMultiplier).toBeCloseTo(25.200406, 9)
      expect(plusHit.attributeMultiplier).toBeCloseTo(37.800609, 9)
      expect(plusHit.physFixed).toBeCloseTo(4695.46, 9)
      expect(plusHit.physMultiplier).toBeCloseTo(baseHit.physMultiplier * 0.7, 4)
      expect(plusHit.attributeMultiplier).toBeCloseTo(baseHit.attributeMultiplier * 0.7, 4)
      expect(plusHit.physFixed).toBeCloseTo(baseHit.physFixed * 0.7, 4)
    }
  })

  it("Surging Waves is a global buff def: 8 stacks/cast of the Plus, +1.25 %/stack, max 40, gated to Dragon Head", () => {
    const surgingWaves = GLOBAL_BUFF_DEFS.find((d) => d.id === "surgingWaves")
    expect(surgingWaves).toBeTruthy()
    expect(surgingWaves!.triggers).toEqual(["Dragon Head - Plus"])
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
  physMultiplier: 36.00058,
  physFixed: 6707.8,
  attributeMultiplier: 54.00087,
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
    physMultiplier: 25.200406,
    physFixed: 4695.46,
    attributeMultiplier: 37.800609,
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

function simulate(skillNames: string[]) {
  const inputs: Inputs = {
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    activeCustomRotation: rotationOf("bellstrikeUmbra", skillNames),
  }
  return simulateTimeline(inputs)
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
