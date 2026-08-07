// Concentration's own effects are modeled separately on the timeline path
// (see `concentration.test.ts` / `site/concentration.ts`) with a
// game-accurate activation counter; the panel no longer bakes a flat, always-
// on directAffinityRate for Insightful Strike, to avoid double-counting the
// SAME site effect through two channels.
import { describe, expect, it } from "vitest"
import { getMindMethodContributions } from "../../src/data/baseStats"
import { buildContext } from "../../src/engine/panel"
import { computeSkillDamage } from "../../src/engine/formula"
import type { FormulaContext } from "../../src/engine/formula"
import { resolveMindMethodOverrides } from "../../src/engine/mindMethodOverrides"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

type Art = Parameters<typeof computeSkillDamage>[0]
const art_ = (a: Record<string, unknown>) => a as unknown as Art
const NS = { name: "Insightful Strike", stacks: "tier 6" } as const

// One DoT-tagged row and one plain row — the pair isolates whether
// `dotDamageBoost` reaches only `specialTag: "sustain"` skills.
const BLEED_DOT = art_({
  name: "Bleed (2 stack)",
  physMultiplier: 0.165,
  attributeMultiplier: 0.2475,
  extraAffinityRate: 0,
  extraAffinityDamage: 0.3,
  correction: 1,
  extraPhysPenetration: 15,
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  specialTag: "sustain",
})

const DRAGONS_BREATH = art_({
  name: "Dragon's Breath 1",
  physMultiplier: 0.90673,
  physFixed: 122.33,
  attributeMultiplier: 1.360095,
  extraAffinityRate: 0,
  extraAffinityDamage: 0,
  correction: 1,
  skillType: "mystic",
  mysticCategory: "burst",
  attributeAttack: "Bellstrike",
})

const mingInputs = (mm: Inputs["mindMethods"]): Inputs => ({
  ...defaultInputs,
  classId: "bellstrikeUmbra",
  mindMethods: mm,
})

describe("Insightful Strike — panel stat rework", () => {
  it("adds phys min/max/pen, NOT bellstrike attack or direct affinity (that now comes from Concentration alone)", () => {
    const withNS = getMindMethodContributions(
      mingInputs([emptyMindMethod, NS, emptyMindMethod, emptyMindMethod]),
    )
    const without = getMindMethodContributions(
      mingInputs([emptyMindMethod, emptyMindMethod, emptyMindMethod, emptyMindMethod]),
    )
    const d = (p: string) => (withNS[p] ?? 0) - (without[p] ?? 0)
    expect(d("phys.min")).toBeCloseTo(22.3, 6)
    expect(d("phys.max")).toBeCloseTo(44.7, 6)
    expect(d("phys.penetration")).toBeCloseTo(0.051, 6)
    expect(d("directAffinityRate")).toBeCloseTo(0, 6)
    expect(d("bellstrike.min")).toBeCloseTo(0, 6)
    expect(d("bellstrike.max")).toBeCloseTo(0, 6)
    expect(d("bellstrike.penetration")).toBeCloseTo(0, 6)
  })
})

describe("Insightful Strike — affinity rate removed, affinity damage kept", () => {
  it("a Nine Sword skill loses the +3% affinity-rate delta but keeps +10% affinity damage", () => {
    const ov = resolveMindMethodOverrides(
      mingInputs([emptyMindMethod, NS, emptyMindMethod, emptyMindMethod]),
    ).artsOverrides["Nine Sword Q"]
    expect(ov?.extraAffinityRate ?? 0).toBe(0)
    expect(ov?.extraAffinityDamage).toBeCloseTo(0.1, 9)
  })
})

describe("Insightful Strike — DoT +10%", () => {
  it("buildContext exposes dotDamageBoost only when Insightful Strike is selected", () => {
    const on = buildContext(mingInputs([emptyMindMethod, NS, emptyMindMethod, emptyMindMethod]))
    const off = buildContext(
      mingInputs([emptyMindMethod, emptyMindMethod, emptyMindMethod, emptyMindMethod]),
    )
    expect(on.dotDamageBoost).toBeCloseTo(0.1, 9)
    expect(off.dotDamageBoost ?? 0).toBe(0)
  })

  it("+10% lands on sustain skills only (raises H by 0.10), not on non-DoT skills", () => {
    const baseCtx: FormulaContext = {
      smallPhys: 1000,
      largePhys: 2000,
      outerPen: 0,
      bellstrike: { min: 100, max: 200, pen: 0 },
      stonesplit: { min: 0, max: 0, pen: 0 },
      silkbind: { min: 0, max: 0, pen: 0 },
      bamboocut: { min: 0, max: 0, pen: 0 },
      primaryAttribute: "Bellstrike",
      attributePrimaryBonus: 51.5,
      precisionPanel: 1,
      critPanel: 0.5,
      affinityPanel: 0.1,
      directCritPanel: 0,
      directAffinityPanel: 0,
      physDmgBoostPanel: 0,
      critDmgBoostPanel: 0.5,
      affinityDmgBoostPanel: 0.25,
      attributeDmgBoostPanel: 0,
      sustainDmgBoostPanel: 0,
      generalDamageBoost: 0,
      chargeBonus: 0,
      effectiveDefense: 0,
      fatigueDamageTaken: 0,
      hasSixHenZhi: false,
      food: false,
      set: null,
      tianGong: null,
      dingYinByTag: {},
      shareDebuffs: { henZhi: false, easyHurt: false },
    }
    const dotArt = BLEED_DOT
    const nonDotArt = DRAGONS_BREATH
    const H = (ctx: FormulaContext, art: Art) =>
      computeSkillDamage(art, ["N/A", "N/A", "N/A", "N/A", "N/A"], ctx, 1).cells.H

    expect(H({ ...baseCtx, dotDamageBoost: 0.1 }, dotArt) - H(baseCtx, dotArt)).toBeCloseTo(0.1, 9)
    expect(H({ ...baseCtx, dotDamageBoost: 0.1 }, nonDotArt) - H(baseCtx, nonDotArt)).toBeCloseTo(
      0,
      9,
    )
  })
})
