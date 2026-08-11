// Scoped to Bellstrike Umbra — see CLASSES.md
import { describe, expect, it } from "vitest"
import {
  bitterSeasonDebuffId,
  bitterSeasonEnvelopeWindows,
  bitterSeasonPoisonSchedule,
  bitterSeasonStackSchedule,
  resolveBitterSeasonTuning,
  BITTER_SEASON_MAX_STACKS,
} from "../../src/engine/buffs/bitterSeason"
import { ZENITH_MAX_EXTENDED_DURATION_FRAMES } from "../../src/data/classes/bellstrikeUmbraGates"
import { allowedInnerWaysForClass, getSchool } from "../../src/engine/panel"

// Sword Horizon's ceiling on the remaining duration an extension may leave.
const ZENITH_CAP_SEC = ZENITH_MAX_EXTENDED_DURATION_FRAMES / 60
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { runEngine } from "../../src/engine/dps"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { seedSkillFromBuiltin, makeSkill, makeHit } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { getMindMethodContributions } from "../../src/data/baseStats"
import { CLASS_IDS } from "../../src/data/classes/registry"
import type { Inputs } from "../../src/engine/types"

describe("bitterSeasonPoisonSchedule", () => {
  it("stays active for the poison duration after a single guaranteed proc", () => {
    const schedule = bitterSeasonPoisonSchedule([0], 1, 5, 20, [], ZENITH_CAP_SEC)
    expect(schedule.activeProbAtTime(1)).toBe(1)
    expect(schedule.activeProbAtTime(4.9)).toBe(1)
    expect(schedule.activeProbAtTime(6)).toBe(0)
  })

  it("a Zenith extension on an active poison pushes its end back 10 s", () => {
    const schedule = bitterSeasonPoisonSchedule([0], 1, 5, 20, [3], ZENITH_CAP_SEC)
    expect(schedule.activeProbAtTime(14.9)).toBe(1)
    expect(schedule.activeProbAtTime(15.1)).toBe(0)
  })

  it("a Zenith extension after the poison has already expired does not reopen it", () => {
    const schedule = bitterSeasonPoisonSchedule([0], 1, 5, 20, [6], ZENITH_CAP_SEC)
    expect(schedule.activeProbAtTime(7)).toBe(0)
  })

  it("caps each Zenith extension's resulting remaining duration at 16 s, re-evaluated per extension", () => {
    const schedule = bitterSeasonPoisonSchedule([0], 1, 5, 40, [4, 9, 14], ZENITH_CAP_SEC)
    expect(schedule.activeProbAtTime(29.9)).toBe(1)
    expect(schedule.activeProbAtTime(30.1)).toBe(0)
  })

  it("an empty extension list (no Zenith bar) gives the same curve as the unextended case", () => {
    const schedule = bitterSeasonPoisonSchedule([0], 1, 5, 20, [], ZENITH_CAP_SEC)
    expect(schedule.activeProbAtTime(1)).toBe(1)
    expect(schedule.activeProbAtTime(4.9)).toBe(1)
    expect(schedule.activeProbAtTime(6)).toBe(0)
  })

  it("returns a zero schedule and does not throw for empty hits / zero proc chance / non-positive duration", () => {
    expect(bitterSeasonPoisonSchedule([], 1, 5, 20, [], ZENITH_CAP_SEC).activeProbAtTime(1)).toBe(0)
    expect(bitterSeasonPoisonSchedule([0], 0, 5, 20, [], ZENITH_CAP_SEC).activeProbAtTime(1)).toBe(
      0,
    )
    expect(bitterSeasonPoisonSchedule([0], 1, 0, 20, [], ZENITH_CAP_SEC).activeProbAtTime(1)).toBe(
      0,
    )
    expect(bitterSeasonPoisonSchedule([0], 1, 5, 0, [], ZENITH_CAP_SEC).activeProbAtTime(1)).toBe(0)
  })
})

describe("bitterSeasonPoisonSchedule.remainingActiveSecAtTime", () => {
  it("counts down toward 0 as the poison's nominal duration elapses, assuming no further hits", () => {
    const schedule = bitterSeasonPoisonSchedule([0], 1, 5, 20, [], ZENITH_CAP_SEC)
    expect(schedule.remainingActiveSecAtTime(1)).toBe(4)
    expect(schedule.remainingActiveSecAtTime(6)).toBe(0)
  })

  it("does not keep counting future hits — it decays even though the schedule as a whole is dense", () => {
    const hits = [0, 0.5, 1, 1.5, 2]
    const schedule = bitterSeasonPoisonSchedule(hits, 1, 5, 20, [], ZENITH_CAP_SEC)
    // The last hit is at 2s, so from 2s the guaranteed window ends at 7s —
    // "remaining" should reflect that, not the rest of the rotation.
    expect(schedule.remainingActiveSecAtTime(2)).toBe(5)
    expect(schedule.remainingActiveSecAtTime(8)).toBe(0)
  })

  it("reflects a Zenith extension that landed while the poison was active", () => {
    const schedule = bitterSeasonPoisonSchedule([0], 1, 5, 20, [3], ZENITH_CAP_SEC)
    expect(schedule.remainingActiveSecAtTime(4)).toBe(11)
  })

  it("is 0 for an empty/zero-guarded schedule", () => {
    expect(
      bitterSeasonPoisonSchedule([], 1, 5, 20, [], ZENITH_CAP_SEC).remainingActiveSecAtTime(1),
    ).toBe(0)
  })
})

describe("bitterSeasonEnvelopeWindows", () => {
  it("refreshes a single window across hits closer together than the poison duration", () => {
    const windows = bitterSeasonEnvelopeWindows([0, 1, 2], 5, [], ZENITH_CAP_SEC)
    expect(windows).toEqual([{ startSec: 0, endSec: 7 }])
  })

  it("splits into separate windows across a gap wider than the poison duration", () => {
    const windows = bitterSeasonEnvelopeWindows([0, 20], 5, [], ZENITH_CAP_SEC)
    expect(windows).toEqual([
      { startSec: 0, endSec: 5 },
      { startSec: 20, endSec: 25 },
    ])
  })

  it("extends the window that is active when the extension lands", () => {
    const windows = bitterSeasonEnvelopeWindows([0], 5, [3], ZENITH_CAP_SEC)
    expect(windows).toEqual([{ startSec: 0, endSec: 15 }])
  })

  it("does not extend a window that has already closed", () => {
    const windows = bitterSeasonEnvelopeWindows([0], 5, [6], ZENITH_CAP_SEC)
    expect(windows).toEqual([{ startSec: 0, endSec: 5 }])
  })

  it("caps each extension's resulting remaining duration at 16 s, re-evaluated per extension — not a lifetime cap (Sword Horizon logic, not Bitter Season specific)", () => {
    // 1 s left -> Zenith hit -> 11 s -> 5 s elapse -> 6 s left -> Zenith hit
    // -> 16 s (capped) -> 5 s elapse -> 11 s left -> Zenith hit -> 16 s
    // (capped again, since remaining had decayed back under 16 s by the time
    // this hit landed).
    const windows = bitterSeasonEnvelopeWindows([0], 5, [4, 9, 14], ZENITH_CAP_SEC)
    // Poison starts at t=0 (ends at 5, i.e. "1 s left" at t=4).
    // t=4: remaining 1 -> min(1+10,16)=11 -> end 15.
    // t=9: remaining 6 -> min(6+10,16)=16 -> end 25.
    // t=14: remaining 11 -> min(11+10,16)=16 -> end 30.
    expect(windows).toEqual([{ startSec: 0, endSec: 30 }])
  })

  it("a further extension arriving while remaining is already at the 16 s cap is a no-op", () => {
    const windows = bitterSeasonEnvelopeWindows([0], 5, [3, 8, 8], ZENITH_CAP_SEC)
    // t=3: remaining 2 -> min(2+10,16)=12 -> end 15.
    // t=8 (first): remaining 7 -> min(7+10,16)=16 -> end 24.
    // t=8 (second, same instant): remaining already 16 -> min(16+10,16)=16 -> no change.
    expect(windows).toEqual([{ startSec: 0, endSec: 24 }])
  })

  it("returns no windows for an empty hit list or a non-positive poison duration", () => {
    expect(bitterSeasonEnvelopeWindows([], 5, [], ZENITH_CAP_SEC)).toEqual([])
    expect(bitterSeasonEnvelopeWindows([0], 0, [], ZENITH_CAP_SEC)).toEqual([])
  })
})

describe("bitterSeasonStackSchedule", () => {
  it("reaches the 5-stack cap under a guaranteed proc and drops to 0 once the shared window lapses", () => {
    const hits = [0, 0.1, 0.2, 0.3, 0.4]
    const schedule = bitterSeasonStackSchedule(hits, 1, 20)
    expect(schedule.expectedStacksAtTime(1)).toBe(5)
    expect(schedule.maxStackProbAtTime(1)).toBe(1)
    expect(schedule.expectedStacksAtTime(11)).toBe(0)
  })

  it("returns a zero schedule and does not throw for empty hits / zero proc chance / non-positive duration", () => {
    expect(bitterSeasonStackSchedule([], 1, 20).expectedStacksAtTime(1)).toBe(0)
    expect(bitterSeasonStackSchedule([0], 0, 20).expectedStacksAtTime(1)).toBe(0)
    expect(bitterSeasonStackSchedule([0], 1, 0).expectedStacksAtTime(1)).toBe(0)
  })
})

describe("resolveBitterSeasonTuning", () => {
  it("is total for tier 0 (base values everywhere)", () => {
    const tuning = resolveBitterSeasonTuning(0)
    expect(tuning.procChance).toBe(0.1)
    expect(tuning.defenseReductionPerStack).toBe(0.006)
    expect(tuning.physPenetrationAtMaxStacks).toBe(0)
  })

  it("upgrades defenseReductionPerStack at tier 1, before proc chance or penetration upgrade", () => {
    const tuning = resolveBitterSeasonTuning(1)
    expect(tuning.procChance).toBe(0.1)
    expect(tuning.defenseReductionPerStack).toBe(0.012)
    expect(tuning.physPenetrationAtMaxStacks).toBe(0)
  })

  it("upgrades procChance at tier 4", () => {
    expect(resolveBitterSeasonTuning(3).procChance).toBe(0.1)
    expect(resolveBitterSeasonTuning(4).procChance).toBe(0.15)
  })

  it("upgrades physPenetrationAtMaxStacks only at tier 6", () => {
    expect(resolveBitterSeasonTuning(5).physPenetrationAtMaxStacks).toBe(0)
    expect(resolveBitterSeasonTuning(6).physPenetrationAtMaxStacks).toBe(0.1)
  })
})

describe("Bitter Season panel-stat tier gating (getMindMethodContributions)", () => {
  const contributionsAt = (stacks: string) =>
    getMindMethodContributions({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: [
        { name: "bitterSeason", stacks },
        emptyMindMethod,
        emptyMindMethod,
        emptyMindMethod,
      ] as Inputs["mindMethods"],
    })

  it("grants neither precision nor physBoost below tier 2", () => {
    const below = contributionsAt("tier 1")
    expect(below.precision ?? 0).toBe(0)
    expect(below.physBoost ?? 0).toBe(0)
  })

  it("grants precision from tier 2, but not physBoost yet", () => {
    const atTier2 = contributionsAt("tier 2")
    expect(atTier2.precision).toBeCloseTo(0.069, 10)
    expect(atTier2.physBoost ?? 0).toBe(0)
  })

  it("grants both precision and physBoost from tier 5 onward", () => {
    for (const stacks of ["tier 5", "tier 6"]) {
      const contributions = contributionsAt(stacks)
      expect(contributions.precision).toBeCloseTo(0.069, 10)
      expect(contributions.physBoost).toBeCloseTo(0.025, 10)
    }
  })
})

describe("registry coverage — every registered class (metadata only, no DPS)", () => {
  it("every class's allowedInnerWaysForClass contains Bitter Season exactly once", () => {
    for (const classId of CLASS_IDS()) {
      const list = allowedInnerWaysForClass(classId)
      expect(list.filter((name) => name === "bitterSeason")).toHaveLength(1)
    }
  })

  it("every class resolves the debuff/skill id pair, matching dot shape and primary attribute", () => {
    for (const classId of CLASS_IDS()) {
      const debuff = builtinDebuffsForClass(classId).find(
        (debuff) => debuff.id === bitterSeasonDebuffId(classId),
      )
      expect(debuff).toBeTruthy()
      expect(debuff!.dot).toBeTruthy()

      const skill = builtinSkillsForClass(classId).find(
        (skill) => skill.id === `${classId}-bitter-season-tick`,
      )
      expect(skill).toBeTruthy()
      expect(skill!.classId).toBe(classId)
      expect(skill!.attributeAttack).toBe(getSchool(classId).primaryAttribute)

      const hit = skill!.hits[0]
      const dot = debuff!.dot!
      expect(hit.physMultiplier).toBe(dot.physMultiplier)
      expect(hit.attributeMultiplier).toBe(dot.attributeMultiplier)
      expect(hit.physFixed).toBe(dot.physFixed)
      expect(hit.attributeFixed).toBe(dot.attributeFixed)
    }
  })
})

const UMBRA_BASE_MIND_METHODS: Inputs["mindMethods"] = [
  { name: "swordHorizon", stacks: "tier 6" },
  { name: "wolfchasersArt", stacks: "tier 6" },
  { name: "insightfulStrike", stacks: "tier 6" },
  { name: "", stacks: "" },
]

function withBitterSeasonAt(tier: "tier 5" | "tier 6"): Inputs["mindMethods"] {
  return [
    UMBRA_BASE_MIND_METHODS[0],
    UMBRA_BASE_MIND_METHODS[1],
    UMBRA_BASE_MIND_METHODS[2],
    { name: "bitterSeason", stacks: tier },
  ]
}

const DOT_ROW_NAME = "Bitter Season Tick (DoT)"

describe("Bitter Season — Bellstrike Umbra engine integration", () => {
  it("the built-in stand-in skill carries the source:innerWayDot tag, five hits, and elevatedAttributeMultiplier === false", () => {
    const skill = builtinSkillsForClass("bellstrikeUmbra").find(
      (skill) => skill.id === "bellstrikeUmbra-bitter-season-tick",
    )
    expect(skill).toBeTruthy()
    expect(skill!.tags).toContain("source:innerWayDot")
    expect(skill!.hits).toHaveLength(5)
    expect(skill!.elevatedAttributeMultiplier).toBe(false)
  })

  it("selecting the inner way at tier 5 raises DPS and adds a Bitter Season Tick (DoT) row", () => {
    const base = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: UMBRA_BASE_MIND_METHODS,
    })
    const withBitterSeason = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 5"),
    })
    expect(withBitterSeason.dps).toBeGreaterThan(base.dps)
    const dotRow = withBitterSeason.perSkill.find((row) => row.name === DOT_ROW_NAME)
    expect(dotRow).toBeTruthy()
    expect(dotRow!.expectedDamage).toBeGreaterThan(0)
  })

  it("withholds Remaining while the poison is unlikely to be up yet (a single low-probability hit)", () => {
    const soleHit = makeSkill("bellstrikeUmbra", {
      name: "Solo Hit",
      hits: [makeHit({ frame: 0, physMultiplier: 1 })],
      castFrames: 300,
    })
    const pad = makeSkill("bellstrikeUmbra", { name: "Pad", castFrames: 300, hits: [makeHit()] })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 6"),
      customSkills: [soleHit, pad],
      activeCustomRotation: makeRotation("bellstrikeUmbra", {
        name: "single-low-probability-hit",
        steps: [
          makeStep({ skillId: soleHit.id, hitCount: 1 }),
          makeStep({ skillId: pad.id, hitCount: 1 }),
        ],
      }),
    }
    const result = simulateTimeline(inputs)
    const chips = (result.casts ?? [])
      .map((cast) => cast.buffs.find((buff) => buff.name === "Bitter Season Tick"))
      .filter((chip): chip is NonNullable<typeof chip> => chip != null)
    expect(chips.length).toBeGreaterThan(0)
    // procChance at tier 6 is 0.15, well under the 0.5 display threshold, so
    // the single hit never makes the poison likely enough to show a "Remaining".
    for (const chip of chips) expect(chip.remainingSec).toBeUndefined()
  })

  it("the Bitter Season Tick chip's Remaining time never exceeds the 16 s Zenith-extension cap", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 6"),
    })
    const remainingValues = (result.casts ?? [])
      .map((cast) => cast.buffs.find((buff) => buff.name === "Bitter Season Tick")?.remainingSec)
      .filter((value): value is number => value != null)
    expect(remainingValues.length).toBeGreaterThan(0)
    for (const remaining of remainingValues) {
      expect(remaining).toBeLessThanOrEqual(16)
    }
  })

  it("tier 6 deals more damage than tier 5 (the physical-resistance node)", () => {
    const tier5 = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 5"),
    })
    const tier6 = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 6"),
    })
    expect(tier6.dps).toBeGreaterThan(tier5.dps)
  })

  it("suppresses the defense/penetration contribution (not the DoT) once the party-applied debuff is active", () => {
    const withoutBitterSeason = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: UMBRA_BASE_MIND_METHODS,
      shareDebuff5HenZhi: true,
    })
    const withBitterSeason = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 6"),
      shareDebuff5HenZhi: true,
    })
    for (const row of withoutBitterSeason.perSkill) {
      const match = withBitterSeason.perSkill.find((candidateRow) => candidateRow.name === row.name)
      expect(match).toBeTruthy()
      expect(match!.expectedDamage).toBe(row.expectedDamage)
    }
  })

  it("two identical runs produce identical dps (the schedule is seeded)", () => {
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 6"),
    }
    const firstRun = runEngine(inputs)
    const secondRun = runEngine(inputs)
    expect(firstRun.dps).toBe(secondRun.dps)
  })

  it("the Rotation Editor casts carry a Bitter Season Poison chip with maxStacks 5 and stacks >= 1", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 6"),
    })
    const chip = result.casts
      ?.flatMap((cast) => cast.buffs)
      .find((chip) => chip.name === "Bitter Season Poison")
    expect(chip).toBeTruthy()
    expect(chip!.maxStacks).toBe(BITTER_SEASON_MAX_STACKS)
    expect(chip!.stacks).toBeGreaterThanOrEqual(1)
  })

  it("the Bitter Season Poison chip carries no raw stat-effect entries, describing the mechanic in its own terms instead", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 6"),
    })
    const chip = result.casts
      ?.flatMap((cast) => cast.buffs)
      .find((chip) => chip.name === "Bitter Season Poison")
    expect(chip).toBeTruthy()
    expect(chip!.effects).toEqual([])
    const description = chip!.description ?? ""
    const defenseMentions = description.match(/target physical defense/g) ?? []
    expect(defenseMentions.length).toBe(2)
    expect(description).toContain("-10 target physical defense at 5/5 stacks (tier 6)")
    expect(description).not.toContain("target physical resistance")
    expect(description).not.toContain("Physical Penetration")
    expect(description).not.toContain("phys.penetration")
  })

  it("scales the shown base defense percentage to the current stack count, not always the 5-stack cap", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 5"),
    })
    const chips = (result.casts ?? [])
      .flatMap((cast) => cast.buffs)
      .filter((chip) => chip.name === "Bitter Season Poison")
    expect(chips.length).toBeGreaterThan(0)
    let sawBelowCap = false
    for (const chip of chips) {
      const description = chip.description ?? ""
      const match = /at (\d)\/5 stacks: -(\d+)% target physical defense/.exec(description)
      expect(match).toBeTruthy()
      const [, stacksText, pctText] = match!
      expect(Number(stacksText)).toBe(chip.stacks)
      // Tier 5 already unlocks the tier-1 node (0.012/stack).
      expect(Number(pctText)).toBe(Math.round(0.012 * chip.stacks * 100))
      if (chip.stacks < BITTER_SEASON_MAX_STACKS) sawBelowCap = true
    }
    expect(sawBelowCap).toBe(true)
  })

  it("editing the stand-in skill's hits in the Skill Editor raises the DoT row's damage", () => {
    const base = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 6"),
    })
    const skill = builtinSkillsForClass("bellstrikeUmbra").find(
      (skill) => skill.id === "bellstrikeUmbra-bitter-season-tick",
    )!
    const seeded = seedSkillFromBuiltin("bellstrikeUmbra", skill)
    seeded.hits = seeded.hits.map((hit) => ({
      ...hit,
      physMultiplier: hit.physMultiplier * 3,
      attributeMultiplier: hit.attributeMultiplier * 3,
    }))
    const bumped = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: withBitterSeasonAt("tier 6"),
      customSkills: [seeded],
    })
    const baseDot = base.perSkill.find((row) => row.name === DOT_ROW_NAME)!.expectedDamage
    const bumpedDot = bumped.perSkill.find((row) => row.name === DOT_ROW_NAME)!.expectedDamage
    expect(bumpedDot).toBeGreaterThan(baseDot)
  })
})
