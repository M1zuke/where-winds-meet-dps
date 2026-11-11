import { describe, expect, it } from "vitest"
import { buffEngineWith } from "../helpers/qiBars"
import type { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { soulShakenBuffDef } from "../../src/data/innerWays/wolfchasersArtBuffs"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { spearq } from "../../src/data/skills/bellstrike-umbra/spearq"
import { spearq5HitCancel } from "../../src/data/skills/bellstrike-umbra/spearq-5-hit-cancel"
import { spearheavy } from "../../src/data/skills/bellstrike-umbra/spearheavy"
import { spearheavy1Hit } from "../../src/data/skills/bellstrike-umbra/spearheavy-1-hit"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { defaultRotationForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"
import { dotRow, testRotation } from "../builtins"
import { DEBUFF } from "../../src/data/skills/bellstrike-umbra/ids"

const FPS = 60
const SOUL_SHAKEN_DURATION_SEC = 18
const PROBE_MARGIN_SEC = 0.001
const TIER_6 = { wolfchasersArt: true, wolfchasersArtTier: 6 }
const CLASS = "bellstrikeUmbra"

function bleedTick() {
  return makeSkill("test", {
    name: "Bleed Tick",
    skillType: "sustain",
    receives: [BUFF.soulShaken],
  })
}

function allDamageBoostSum(effects: { statKey: string; amount: number }[]): number {
  return effects
    .filter((effect) => effect.statKey === "allDamageBoost")
    .reduce((sum, effect) => sum + effect.amount, 0)
}

function boostOnBleedAt(engine: BuffEngine, timeSec: number): number {
  return allDamageBoostSum(engine.calculateDamageEffects(bleedTick(), timeSec).effects)
}

function hitSecondsOf(skill: Skill, castStartSec = 0): number[] {
  return skill.hits.map((hit) => castStartSec + hit.frame / FPS)
}

function landHits(engine: BuffEngine, skill: Skill, castStartSec = 0): void {
  for (const hitSec of hitSecondsOf(skill, castStartSec))
    engine.processDamageHitPostQi(hitSec, skill)
}

function soulShakenEngine(params: Record<string, unknown> = {}): BuffEngine {
  return buffEngineWith(params, [], [soulShakenBuffDef()])
}

describe("Soul Shaken — BuffEngine unit", () => {
  it("a Sober Sorrow cast adds each Soul-Shaken stack at its own hit, not spread over the cast", () => {
    const engine = soulShakenEngine(TIER_6)
    landHits(engine, spearq)
    const [firstHitSec, secondHitSec] = hitSecondsOf(spearq)
    expect(boostOnBleedAt(engine, firstHitSec - PROBE_MARGIN_SEC)).toBe(0)
    expect(boostOnBleedAt(engine, firstHitSec + PROBE_MARGIN_SEC)).toBeCloseTo(0.1, 6)
    expect(boostOnBleedAt(engine, secondHitSec - PROBE_MARGIN_SEC)).toBeCloseTo(0.1, 6)
    expect(boostOnBleedAt(engine, secondHitSec + PROBE_MARGIN_SEC)).toBeCloseTo(0.2, 6)
  })

  it("a cast that lands no hit grants no Soul-Shaken stack", () => {
    const engine = soulShakenEngine(TIER_6)
    engine.processSkillCast(spearq.castTag!, 0, {}, false, [BUFF.soulShaken])
    expect(boostOnBleedAt(engine, 0.1)).toBe(0)
  })

  it("a single-hit Drifting Thrust grants its stack at the hit, not at the cast start", () => {
    const engine = soulShakenEngine()
    landHits(engine, spearheavy1Hit)
    const [hitSec] = hitSecondsOf(spearheavy1Hit)
    expect(hitSec).toBeGreaterThan(0)
    expect(boostOnBleedAt(engine, hitSec - PROBE_MARGIN_SEC)).toBe(0)
    expect(boostOnBleedAt(engine, hitSec + PROBE_MARGIN_SEC)).toBeCloseTo(0.1, 6)
  })

  it("Drifting Thrust ramps to 5 stacks, +50% all-damage on a Bleed Tick, and holds at the cap", () => {
    const engine = soulShakenEngine()
    landHits(engine, spearheavy)
    const hitSeconds = hitSecondsOf(spearheavy)
    expect(boostOnBleedAt(engine, hitSeconds[0] - PROBE_MARGIN_SEC)).toBe(0)
    expect(boostOnBleedAt(engine, hitSeconds[0] + PROBE_MARGIN_SEC)).toBeCloseTo(0.1, 6)
    expect(boostOnBleedAt(engine, hitSeconds[4] + PROBE_MARGIN_SEC)).toBeCloseTo(0.5, 6)
    expect(
      boostOnBleedAt(engine, hitSeconds[hitSeconds.length - 1] + PROBE_MARGIN_SEC),
    ).toBeCloseTo(0.5, 6)
  })

  it("a granting hit refreshes Soul-Shaken at the cap", () => {
    const engine = soulShakenEngine(TIER_6)
    landHits(engine, spearq)
    const hitSeconds = hitSecondsOf(spearq)
    const fifthHitSec = hitSeconds[4]
    const sixthHitSec = hitSeconds[5]
    expect(boostOnBleedAt(engine, fifthHitSec + SOUL_SHAKEN_DURATION_SEC + 0.01)).toBeCloseTo(
      0.5,
      6,
    )
    expect(
      boostOnBleedAt(engine, sixthHitSec + SOUL_SHAKEN_DURATION_SEC - PROBE_MARGIN_SEC),
    ).toBeCloseTo(0.5, 6)
    expect(boostOnBleedAt(engine, sixthHitSec + SOUL_SHAKEN_DURATION_SEC + 0.05)).toBe(0)
  })

  it("Soul-Shaken ends 18 s after the last granting hit of a SpearQ 5-hit cancel", () => {
    const engine = soulShakenEngine(TIER_6)
    landHits(engine, spearq5HitCancel)
    const lastHitSec = hitSecondsOf(spearq5HitCancel).at(-1)!
    expect(
      boostOnBleedAt(engine, lastHitSec + SOUL_SHAKEN_DURATION_SEC - PROBE_MARGIN_SEC),
    ).toBeCloseTo(0.5, 6)
    expect(boostOnBleedAt(engine, lastHitSec + SOUL_SHAKEN_DURATION_SEC + 0.05)).toBe(0)
  })

  it("a later SpearQ cast renews Soul-Shaken instead of letting the window lapse", () => {
    const engine = soulShakenEngine(TIER_6)
    landHits(engine, spearq)
    landHits(engine, spearq, 20)
    expect(boostOnBleedAt(engine, 30)).toBeCloseTo(0.5, 6)
  })

  it("a SpearQ grants no Soul-Shaken without Wolfchaser's Art tier 6, a SpearHeavy does", () => {
    const engine = soulShakenEngine()
    landHits(engine, spearq)
    expect(boostOnBleedAt(engine, 1)).toBe(0)
    landHits(engine, spearheavy1Hit, 2)
    expect(boostOnBleedAt(engine, 3)).toBeCloseTo(0.1, 6)
  })

  it("a SpearQ at Wolfchaser's Art tier 6 and a SpearHeavy stack into the same window", () => {
    const engine = soulShakenEngine(TIER_6)
    landHits(engine, spearheavy1Hit)
    landHits(engine, spearq, 1)
    const [firstSpearQHitSec] = hitSecondsOf(spearq, 1)
    expect(boostOnBleedAt(engine, firstSpearQHitSec + PROBE_MARGIN_SEC)).toBeCloseTo(0.2, 6)
  })

  it("the granting hit itself takes no Soul-Shaken bonus", () => {
    const engine = soulShakenEngine(TIER_6)
    landHits(engine, spearq)
    landHits(engine, spearheavy, 5)
    for (const grantingSkill of [spearq, spearheavy]) {
      expect(engine.calculateDamageEffects(grantingSkill, 6).effects).toHaveLength(0)
    }
  })

  it("does not affect an unrelated skill", () => {
    const engine = soulShakenEngine(TIER_6)
    landHits(engine, spearq)
    expect(engine.calculateDamageEffects(bleedTick(), 2).effects.length).toBeGreaterThan(0)
    expect(
      engine.calculateDamageEffects(makeSkill("test", { name: "Other" }), 2).effects,
    ).toHaveLength(0)
  })
})

function soulShakenInputs(skills: Skill[]): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    activeCustomRotation: testRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id })),
    }),
  }
}

function probeDamage(skills: Skill[]): number {
  return simulateTimeline(soulShakenInputs(skills))
    .perSkill.filter((row) => row.name === "Probe")
    .reduce((sum, row) => sum + row.expectedDamage, 0)
}

function probeSkill(): Skill {
  return makeSkill(CLASS, {
    name: "Probe",
    castFrames: 30,
    receives: [BUFF.soulShaken],
    hits: [makeHit({ frame: 0, physMultiplier: 1 })],
  })
}

function granterSkill(grants: boolean): Skill {
  return makeSkill(CLASS, {
    name: "Granter",
    castFrames: 30,
    triggersBuffs: grants ? [BUFF.soulShaken] : [],
    hits: [makeHit({ frame: 0, physMultiplier: 1 })],
  })
}

describe("Soul Shaken — end to end through simulateTimeline", () => {
  it("boosts bellstrikeUmbra's Bleeding DoT damage relative to a build without wolfchasersArt (default rotation already casts SpearHeavy + SpearQ)", () => {
    const rotation = defaultRotationForClass("bellstrikeUmbra")!
    const withoutWolf: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
    }
    const withWolf: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
      mindMethods: [
        { name: "Wolfchaser's Art", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
    }
    const before = simulateTimeline(withoutWolf)
    const after = simulateTimeline(withWolf)
    const bleedDamage = (timeline: ReturnType<typeof simulateTimeline>) =>
      timeline.perSkill
        .filter((skill) => skill.name === dotRow("bellstrikeUmbra", DEBUFF.bleedTick))
        .reduce((sum, skill) => sum + skill.expectedDamage, 0)
    expect(bleedDamage(after)).toBeGreaterThan(bleedDamage(before))
  })

  it("a granting hit lifts a later hit that receives Soul-Shaken", () => {
    const baseline = probeDamage([granterSkill(false), probeSkill()])
    expect(probeDamage([granterSkill(true), probeSkill()])).toBeGreaterThan(baseline)
  })
})
