// Damage assertions scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { computeSkillDamage } from "../../src/engine/formula"
import type { FormulaContext } from "../../src/engine/formula"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings } from "../../src/engine/types"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeSkill } from "../../src/engine/skill"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"

describe("Dragon Head registry — universal mystic, both versions", () => {
  it("Bellstrike Umbra exposes both versions with the workbook coefficients", () => {
    const classId = "bellstrikeUmbra"
    const base = builtinSkill("bellstrikeUmbra", UNIVERSAL_SKILL.dragonHead)
    const plus = builtinSkill("bellstrikeUmbra", UNIVERSAL_SKILL.dragonHeadPlus)
    expect(base).toBeTruthy()
    expect(plus).toBeTruthy()
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
  })

  it("Surging Waves is a global buff def: 8 stacks/cast of the Plus (40 with the ally toggle), +1.25 %/stack, max 40, gated to Dragon Head", () => {
    const surgingWaves = GLOBAL_BUFF_DEFS.find((module) => module.id === "surgingWaves")
    expect(surgingWaves).toBeTruthy()
    expect(surgingWaves!.triggeredBy).toEqual(["cast:dragonHeadPlus"])
    expect(surgingWaves!.maxStacks).toBe(40)
    expect(surgingWaves!.duration).toBe(6)
    expect(surgingWaves!.affects).toEqual(["role:dragonHead"])

    const dragonHeadHit = makeSkill("test", { name: "probe", tags: ["role:dragonHead"] })
    const engine = new BuffEngine({}, GLOBAL_BUFF_DEFS)
    engine.processSkillCast("cast:dragonHeadPlus", 0)
    expect(engine.calculateDamageEffects(dragonHeadHit, 0).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.0125 * 8,
    })

    const engineWithAllies = new BuffEngine({ allySurgingWaves: true }, GLOBAL_BUFF_DEFS)
    engineWithAllies.processSkillCast("cast:dragonHeadPlus", 0)
    expect(engineWithAllies.calculateDamageEffects(dragonHeadHit, 0).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.0125 * 40,
    })
  })
})

type Art = Parameters<typeof computeSkillDamage>[0]
const asArt = (fields: Record<string, unknown>) => fields as unknown as Art

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
  classSpecificAttunement: {
    "classSpecificAttunement 1": 0,
    "classSpecificAttunement 2": 0,
    "classSpecificAttunement 3": 0,
  },
  shareDebuffs: { henZhi: false, easyHurt: false },
}

describe("guaranteedNormal — fixed damage, immune to every rate", () => {
  const fixed = asArt({ name: "Dragon Head", ...DRAGON_HEAD_ROW, guaranteedNormal: 1 })
  const normal = asArt({ name: "Dragon Head (unflagged)", ...DRAGON_HEAD_ROW })

  it("expected damage equals the normal row (EF), not the rate-weighted mix", () => {
    const result = computeSkillDamage(fixed, ctx, 1)
    expect(result.expectedDamage).toBeCloseTo(result.cells.EF, 6)
    const unflagged = computeSkillDamage(normal, ctx, 1)
    expect(unflagged.expectedDamage).toBeCloseTo(unflagged.cells.EH, 6)
    expect(result.expectedDamage).not.toBeCloseTo(unflagged.expectedDamage, 0)
  })

  it("crit, affinity and precision rates do not move it", () => {
    const base = computeSkillDamage(fixed, ctx, 1).expectedDamage
    const ratesUp = computeSkillDamage(
      fixed,
      { ...ctx, critPanel: 0.8, affinityPanel: 0.4, precisionPanel: 0.5 },
      1,
    ).expectedDamage
    expect(ratesUp).toBeCloseTo(base, 6)
  })
})

describe("guaranteedPrecision — never abrades, crit/affinity still roll", () => {
  const plus = asArt({
    name: "Dragon Head - Plus",
    ...DRAGON_HEAD_ROW,
    physMultiplier: 17.3793,
    physFixed: 3237,
    attributeMultiplier: 26.0689,
    guaranteedPrecision: 1,
  })

  it("U is 1 and the abrasion weight AL is 0 even at low panel precision", () => {
    const cells = computeSkillDamage(plus, { ...ctx, precisionPanel: 0.5 }, 1).cells
    expect(cells.U).toBe(1)
    expect(cells.AL).toBe(0)
  })

  it("lowering precision does not lower it, but does lower the unflagged variant", () => {
    const lowPrecision = { ...ctx, precisionPanel: 0.5 }
    const flagged = computeSkillDamage(plus, lowPrecision, 1).expectedDamage
    expect(flagged).toBeCloseTo(computeSkillDamage(plus, ctx, 1).expectedDamage, 6)

    const unflagged = asArt({ ...plus, guaranteedPrecision: undefined })
    const unflaggedLow = computeSkillDamage(unflagged, lowPrecision, 1).expectedDamage
    const unflaggedBase = computeSkillDamage(unflagged, ctx, 1).expectedDamage
    expect(unflaggedLow).toBeLessThan(unflaggedBase)
  })

  it("raising crit rate still raises it", () => {
    const base = computeSkillDamage(plus, ctx, 1).expectedDamage
    const highCrit = computeSkillDamage(plus, { ...ctx, critPanel: 0.8 }, 1).expectedDamage
    expect(highCrit).toBeGreaterThan(base)
  })
})

function rotationOf(classId: string, skillIds: string[]) {
  const steps = skillIds.map((skillId) => {
    const skill = builtinSkill(classId, skillId)
    return makeStep({ skillId: skill.id, hitCount: skill.hits.length })
  })
  return makeRotation(classId, { name: `test-${skillIds.join("+")}`, steps })
}

function simulate(skillIds: string[], overrides: Partial<Inputs> = {}) {
  const inputs: Inputs = {
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    activeCustomRotation: rotationOf("bellstrikeUmbra", skillIds),
    ...overrides,
  }
  return simulateTimeline(inputs)
}

function withFullStacks(): Partial<Inputs> {
  return {
    combatSettings: { ...defaultCombatSettings(), dragonHeadFullStacks: true },
  }
}

function skillDamage(result: ReturnType<typeof simulateTimeline>, skillId: string): number {
  const name = builtinSkill("bellstrikeUmbra", skillId).name
  return result.perSkill
    .filter((entry) => entry.name === name)
    .reduce((sum, entry) => sum + entry.expectedDamage, 0)
}

describe("Surging Waves in the timeline (Bellstrike Umbra)", () => {
  it("a second Plus cast inside the 6 s window is boosted by the first cast's stacks", () => {
    const oneCast = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus]),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    const twoCasts = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus, UNIVERSAL_SKILL.dragonHeadPlus]),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    expect(oneCast).toBeGreaterThan(0)
    // cast 1 lands at 8 stacks, cast 2 at 16 — the pair outdamages 2 independent casts
    expect(twoCasts).toBeGreaterThan(2 * oneCast)
  })

  it("Surging Waves does not leak onto other skills", () => {
    const alone = skillDamage(simulate([SKILL.swordq]), SKILL.swordq)
    const afterPlus = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus, SKILL.swordq]),
      SKILL.swordq,
    )
    expect(afterPlus).toBeCloseTo(alone, 6)
  })

  it("the base version's timeline damage ignores precision", () => {
    const base = simulate([UNIVERSAL_SKILL.dragonHead])
    const lowPrecision = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      precision: 0.7,
      activeCustomRotation: rotationOf("bellstrikeUmbra", [UNIVERSAL_SKILL.dragonHead]),
    })
    expect(skillDamage(base, UNIVERSAL_SKILL.dragonHead)).toBeGreaterThan(0)
    expect(skillDamage(lowPrecision, UNIVERSAL_SKILL.dragonHead)).toBeCloseTo(
      skillDamage(base, UNIVERSAL_SKILL.dragonHead),
      6,
    )
  })
})

describe("40 Stacks (Dragon Head) teammate buff", () => {
  const surgingWavesStacks = (result: ReturnType<typeof simulateTimeline>) =>
    (result.casts ?? []).map(
      (cast) => cast.buffs.find((buff) => buff.id === "surgingWaves")?.stacks ?? 0,
    )

  it("holds every cast at the 40-stack cap instead of climbing 8 at a time", () => {
    const fiveCasts = Array(5).fill(UNIVERSAL_SKILL.dragonHeadPlus)
    const selfOnly = surgingWavesStacks(simulate(fiveCasts))
    expect(selfOnly[0]).toBeLessThan(40)
    expect(selfOnly).toEqual([...selfOnly].sort((left, right) => left - right))
    expect(surgingWavesStacks(simulate(fiveCasts, withFullStacks()))).toEqual([40, 40, 40, 40, 40])
  })

  it("raises the first cast's damage over the self-only 8 stacks", () => {
    const selfOnly = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus]),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    const withAllies = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], withFullStacks()),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    expect(withAllies).toBeGreaterThan(selfOnly)
  })

  it("leaves other skills untouched", () => {
    const alone = skillDamage(simulate([SKILL.swordq]), SKILL.swordq)
    const afterPlus = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus, SKILL.swordq], withFullStacks()),
      SKILL.swordq,
    )
    expect(afterPlus).toBeCloseTo(alone, 6)
  })
})

describe("Max Low-HP Bonus (Dragon Head)", () => {
  const withLowHp = (): Partial<Inputs> => ({
    combatSettings: { ...defaultCombatSettings(), dragonHeadLowHpMaxBonus: true },
  })

  it("is a global buff def applying the sourced 45 % cap, gated to the Plus", () => {
    const dragonHeadLowHp = GLOBAL_BUFF_DEFS.find((module) => module.id === "dragonHeadLowHp")
    expect(dragonHeadLowHp).toBeTruthy()
    expect(dragonHeadLowHp!.effects).toEqual([
      { kind: "stat", statKey: "allDamageBoost", amount: 0.45 },
    ])
    expect(dragonHeadLowHp!.affects).toEqual(["role:dragonHeadPlus"])
    expect(dragonHeadLowHp!.requires?.param).toBe("dragonHeadLowHpMaxBonus")
    expect(dragonHeadLowHp!.alwaysActive).toBe(true)
  })

  it("does nothing until the toggle is on", () => {
    const plain = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus]),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    const boosted = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], withLowHp()),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    expect(boosted).toBeGreaterThan(plain)
  })

  // Cross-checked against Revelry Script, a known +0.30 into the same additive
  // pool: it fixes the pool size independently, which then predicts the 0.45.
  it("adds exactly 0.45 to the same additive pool Revelry Script feeds", () => {
    const withRevelry = (): Partial<Inputs> => ({
      combatSettings: { ...defaultCombatSettings(), revelryScript: true },
    })
    const plain = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus]),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    const revelry = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], withRevelry()),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    const lowHp = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], withLowHp()),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )

    const pool = 0.3 / (revelry / plain - 1)
    expect(lowHp / plain).toBeCloseTo((pool + 0.45) / pool, 9)
  })

  it("does not touch the base version or any other skill", () => {
    for (const name of [UNIVERSAL_SKILL.dragonHead, SKILL.swordq]) {
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

  it("carries the tag on Bellstrike Umbra's built-in Plus, and never on the base version", () => {
    const plus = builtinSkill("bellstrikeUmbra", UNIVERSAL_SKILL.dragonHeadPlus)
    const base = builtinSkill("bellstrikeUmbra", UNIVERSAL_SKILL.dragonHead)
    expect(plus.tags).toContain("prop:hasQiBreakDoubleDamage")
    expect(base.tags).not.toContain("prop:hasQiBreakDoubleDamage")
  })

  // Same id, so it replaces the built-in wholesale: identical name, hits and
  // buff triggers, differing only by the tag. Comparing against the window's
  // pre-existing +10 % boost instead would not isolate the doubling.
  const withoutTheTag = (): Inputs["customSkills"] => {
    const plus = builtinSkillsForClass("bellstrikeUmbra").find(
      (skill) => skill.id === builtinSkill("bellstrikeUmbra", UNIVERSAL_SKILL.dragonHeadPlus).id,
    )!
    return [
      {
        ...plus,
        tags: (plus.tags ?? []).filter((tag) => tag !== "prop:hasQiBreakDoubleDamage"),
      },
    ]
  }

  it("is worth exactly x2 inside the window", () => {
    const tagged = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], insideBreak),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    const untagged = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], { ...insideBreak, customSkills: withoutTheTag() }),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    expect(tagged / untagged).toBeCloseTo(2, 9)
  })

  it("changes nothing outside the window", () => {
    const tagged = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], outsideBreak),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    const untagged = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], {
        ...outsideBreak,
        customSkills: withoutTheTag(),
      }),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    expect(tagged).toBeCloseTo(untagged, 6)
  })

  it("does not double when the Qi Break Window toggle is off", () => {
    const off = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], qiBreak(false, 0)),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    const outside = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHeadPlus], outsideBreak),
      UNIVERSAL_SKILL.dragonHeadPlus,
    )
    expect(off).toBeCloseTo(outside, 6)
  })

  it("does not double the base version, which only gets the window's boost", () => {
    const outside = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHead], outsideBreak),
      UNIVERSAL_SKILL.dragonHead,
    )
    const inside = skillDamage(
      simulate([UNIVERSAL_SKILL.dragonHead], insideBreak),
      UNIVERSAL_SKILL.dragonHead,
    )
    expect(inside).toBeGreaterThan(outside)
    expect(inside / outside).toBeLessThan(1.5)
  })
})
