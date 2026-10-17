// Scoped to Bellstrike Umbra — see CLASSES.md
import { describe, expect, it } from "vitest"
import {
  bitterSeasonDebuffId,
  BitterSeasonEnvelope,
  BitterSeasonTracker,
  BITTER_SEASON_MAX_STACKS,
} from "../../src/engine/buffs/bitterSeason"
import { bitterSeasonTuningAtTier } from "../../src/data/innerWays/bitterSeason"
import { MulberryBank, mulberry32 } from "../../src/engine/rng"
import { ZENITH_MAX_EXTENDED_DURATION_FRAMES } from "../../src/data/innerWays/swordHorizonZenith"
import { allowedInnerWaysForClass, getSchool } from "../../src/engine/panel"

// Sword Horizon's ceiling on the remaining duration an extension may leave.
const ZENITH_CAP_SEC = ZENITH_MAX_EXTENDED_DURATION_FRAMES / 60
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { runEngine } from "../../src/engine/dps"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { seedSkillFromBuiltin, makeSkill, makeHit } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { getMindMethodContributions } from "../../src/definitions/baseStats"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import type { Inputs } from "../../src/engine/types"
import { DEFAULT_QI_BREAK_WINDOW } from "../../src/engine/qiBreak"

interface TrackerEvent {
  kind: "hit" | "extension"
  timeSec: number
}

function chronological(hitsSec: readonly number[], extensionsSec: readonly number[]) {
  const events: TrackerEvent[] = [
    ...hitsSec.map((timeSec) => ({ kind: "hit" as const, timeSec })),
    ...extensionsSec.map((timeSec) => ({ kind: "extension" as const, timeSec })),
  ]
  return events.sort(
    (left, right) =>
      left.timeSec - right.timeSec || (left.kind === right.kind ? 0 : left.kind === "hit" ? -1 : 1),
  )
}

function trackerAfter(options: {
  hitsSec: readonly number[]
  procChance: number
  poisonDurationSec: number
  extensionsSec?: readonly number[]
  runRandom?: () => number
}): BitterSeasonTracker {
  const tracker = new BitterSeasonTracker(options.procChance, options.runRandom, true)
  for (const event of chronological(options.hitsSec, options.extensionsSec ?? [])) {
    if (event.kind === "hit") tracker.roll(event.timeSec, 1, options.poisonDurationSec)
    else tracker.extendPoison(event.timeSec, ZENITH_CAP_SEC)
  }
  return tracker
}

function envelopeAfter(
  hitsSec: readonly number[],
  poisonDurationSec: number,
  extensionsSec: readonly number[] = [],
) {
  const envelope = new BitterSeasonEnvelope(poisonDurationSec, ZENITH_CAP_SEC)
  for (const event of chronological(hitsSec, extensionsSec)) {
    if (event.kind === "hit") envelope.hit(event.timeSec)
    else envelope.extension(event.timeSec)
  }
  return envelope.windowsSoFar()
}

describe("BitterSeasonTracker poison", () => {
  it("stays active for the poison duration after a single guaranteed proc", () => {
    const tracker = trackerAfter({ hitsSec: [0], procChance: 1, poisonDurationSec: 5 })
    expect(tracker.poisonActiveProbAt(1)).toBe(1)
    expect(tracker.poisonActiveProbAt(4.9)).toBe(1)
    expect(tracker.poisonActiveProbAt(6)).toBe(0)
  })

  it("a Zenith extension on an active poison pushes its end back 10 s", () => {
    const tracker = trackerAfter({
      hitsSec: [0],
      procChance: 1,
      poisonDurationSec: 5,
      extensionsSec: [3],
    })
    expect(tracker.poisonActiveProbAt(14.9)).toBe(1)
    expect(tracker.poisonActiveProbAt(15.1)).toBe(0)
  })

  it("a Zenith extension after the poison has already expired does not reopen it", () => {
    const tracker = trackerAfter({
      hitsSec: [0],
      procChance: 1,
      poisonDurationSec: 5,
      extensionsSec: [6],
    })
    expect(tracker.poisonActiveProbAt(7)).toBe(0)
  })

  it("caps each Zenith extension's resulting remaining duration at 16 s, re-evaluated per extension", () => {
    const tracker = trackerAfter({
      hitsSec: [0],
      procChance: 1,
      poisonDurationSec: 5,
      extensionsSec: [4, 9, 14],
    })
    expect(tracker.poisonActiveProbAt(29.9)).toBe(1)
    expect(tracker.poisonActiveProbAt(30.1)).toBe(0)
  })

  it("an empty extension list (no Zenith bar) gives the same curve as the unextended case", () => {
    const tracker = trackerAfter({ hitsSec: [0], procChance: 1, poisonDurationSec: 5 })
    expect(tracker.poisonActiveProbAt(1)).toBe(1)
    expect(tracker.poisonActiveProbAt(4.9)).toBe(1)
    expect(tracker.poisonActiveProbAt(6)).toBe(0)
  })

  it("stays at zero and does not throw with no hits, a zero proc chance or a non-positive duration", () => {
    expect(
      trackerAfter({ hitsSec: [], procChance: 1, poisonDurationSec: 5 }).poisonActiveProbAt(1),
    ).toBe(0)
    expect(
      trackerAfter({ hitsSec: [0], procChance: 0, poisonDurationSec: 5 }).poisonActiveProbAt(1),
    ).toBe(0)
    expect(
      trackerAfter({ hitsSec: [0], procChance: 1, poisonDurationSec: 0 }).poisonActiveProbAt(1),
    ).toBe(0)
  })

  it("answers an earlier time from the state the rolls before it left", () => {
    const tracker = trackerAfter({ hitsSec: [0, 20], procChance: 1, poisonDurationSec: 5 })
    expect(tracker.poisonActiveProbAt(3)).toBe(1)
    expect(tracker.poisonActiveProbAt(10)).toBe(0)
    expect(tracker.poisonActiveProbAt(21)).toBe(1)
  })
})

describe("BitterSeasonTracker.poisonRemainingSecAt", () => {
  it("counts down toward 0 as the poison's nominal duration elapses, assuming no further hits", () => {
    const tracker = trackerAfter({ hitsSec: [0], procChance: 1, poisonDurationSec: 5 })
    expect(tracker.poisonRemainingSecAt(1)).toBe(4)
    expect(tracker.poisonRemainingSecAt(6)).toBe(0)
  })

  it("does not keep counting future hits — it decays even though the hit train is dense", () => {
    const tracker = trackerAfter({
      hitsSec: [0, 0.5, 1, 1.5, 2],
      procChance: 1,
      poisonDurationSec: 5,
    })
    expect(tracker.poisonRemainingSecAt(2)).toBe(5)
    expect(tracker.poisonRemainingSecAt(8)).toBe(0)
  })

  it("reflects a Zenith extension that landed while the poison was active", () => {
    const tracker = trackerAfter({
      hitsSec: [0],
      procChance: 1,
      poisonDurationSec: 5,
      extensionsSec: [3],
    })
    expect(tracker.poisonRemainingSecAt(4)).toBe(11)
  })

  it("is 0 before anything has rolled", () => {
    expect(
      trackerAfter({ hitsSec: [], procChance: 1, poisonDurationSec: 5 }).poisonRemainingSecAt(1),
    ).toBe(0)
  })
})

describe("BitterSeasonEnvelope", () => {
  it("refreshes a single window across hits closer together than the poison duration", () => {
    expect(envelopeAfter([0, 1, 2], 5)).toEqual([{ startSec: 0, endSec: 7 }])
  })

  it("splits into separate windows across a gap wider than the poison duration", () => {
    expect(envelopeAfter([0, 20], 5)).toEqual([
      { startSec: 0, endSec: 5 },
      { startSec: 20, endSec: 25 },
    ])
  })

  it("extends the window that is active when the extension lands", () => {
    expect(envelopeAfter([0], 5, [3])).toEqual([{ startSec: 0, endSec: 15 }])
  })

  it("does not extend a window that has already closed", () => {
    expect(envelopeAfter([0], 5, [6])).toEqual([{ startSec: 0, endSec: 5 }])
  })

  it("caps each extension's resulting remaining duration at 16 s, re-evaluated per extension — not a lifetime cap (Sword Horizon logic, not Bitter Season specific)", () => {
    // 1 s left -> Zenith hit -> 11 s -> 5 s elapse -> 6 s left -> Zenith hit
    // -> 16 s (capped) -> 5 s elapse -> 11 s left -> Zenith hit -> 16 s
    // (capped again, since remaining had decayed back under 16 s by the time
    // this hit landed).
    expect(envelopeAfter([0], 5, [4, 9, 14])).toEqual([{ startSec: 0, endSec: 30 }])
  })

  it("a further extension arriving while remaining is already at the 16 s cap is a no-op", () => {
    expect(envelopeAfter([0], 5, [3, 8, 8])).toEqual([{ startSec: 0, endSec: 24 }])
  })

  it("returns no windows with no hits or a non-positive poison duration", () => {
    expect(envelopeAfter([], 5)).toEqual([])
    expect(envelopeAfter([0], 0)).toEqual([])
  })
})

describe("BitterSeasonTracker stacks", () => {
  it("reaches the 5-stack cap under a guaranteed proc and drops to 0 once the shared window lapses", () => {
    const tracker = trackerAfter({
      hitsSec: [0, 0.1, 0.2, 0.3, 0.4],
      procChance: 1,
      poisonDurationSec: 5,
    })
    expect(tracker.expectedStacksAt(1)).toBe(5)
    expect(tracker.maxStackProbAt(1)).toBe(1)
    expect(tracker.expectedStacksAt(11)).toBe(0)
  })

  it("stays at zero with no hits or a zero proc chance", () => {
    expect(
      trackerAfter({ hitsSec: [], procChance: 1, poisonDurationSec: 5 }).expectedStacksAt(1),
    ).toBe(0)
    expect(
      trackerAfter({ hitsSec: [0], procChance: 0, poisonDurationSec: 5 }).expectedStacksAt(1),
    ).toBe(0)
  })

  it("lands a rolled stack from the moment of the roll, never before it", () => {
    const tracker = new BitterSeasonTracker(1, undefined, true)
    expect(tracker.expectedStacksAt(2)).toBe(0)
    tracker.roll(2, 1, 5)
    expect(tracker.expectedStacksAt(2)).toBe(1)
    expect(tracker.expectedStacksAt(1.9)).toBe(0)
  })
})

describe("bitterSeasonTuningAtTier", () => {
  it("is total for tier 0 (base values everywhere)", () => {
    const tuning = bitterSeasonTuningAtTier(0)
    expect(tuning.procChance).toBe(0.1)
    expect(tuning.defenseReductionPerStack).toBe(0.006)
    expect(tuning.physPenetrationAtMaxStacks).toBe(0)
  })

  it("upgrades defenseReductionPerStack at tier 1, before proc chance or penetration upgrade", () => {
    const tuning = bitterSeasonTuningAtTier(1)
    expect(tuning.procChance).toBe(0.1)
    expect(tuning.defenseReductionPerStack).toBe(0.012)
    expect(tuning.physPenetrationAtMaxStacks).toBe(0)
  })

  it("holds procChance at 0.1 through tiers 4-5, and upgrades it only at tier 6", () => {
    expect(bitterSeasonTuningAtTier(3).procChance).toBe(0.1)
    expect(bitterSeasonTuningAtTier(4).procChance).toBe(0.1)
    expect(bitterSeasonTuningAtTier(5).procChance).toBe(0.1)
    expect(bitterSeasonTuningAtTier(6).procChance).toBe(0.15)
  })

  it("upgrades physPenetrationAtMaxStacks only at tier 6", () => {
    expect(bitterSeasonTuningAtTier(5).physPenetrationAtMaxStacks).toBe(0)
    expect(bitterSeasonTuningAtTier(6).physPenetrationAtMaxStacks).toBe(0.1)
  })
})

describe("Bitter Season panel-stat tier gating (getMindMethodContributions)", () => {
  const contributionsAt = (stacks: string) =>
    getMindMethodContributions({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      breakthrough: 17,
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
    expect(atTier2.precision).toBeCloseTo(0.072, 10)
    expect(atTier2.physBoost ?? 0).toBe(0)
  })

  it("grants both precision and physBoost from tier 5 onward", () => {
    for (const stacks of ["tier 5", "tier 6"]) {
      const contributions = contributionsAt(stacks)
      expect(contributions.precision).toBeCloseTo(0.072, 10)
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
  it("the built-in stand-in skill carries the source:innerWayDot tag, one hit and no attribute coefficient", () => {
    const skill = builtinSkillsForClass("bellstrikeUmbra").find(
      (skill) => skill.id === "bellstrikeUmbra-bitter-season-tick",
    )
    expect(skill).toBeTruthy()
    expect(skill!.tags).toContain("source:innerWayDot")
    expect(skill!.hits).toHaveLength(1)
    expect(skill!.hits[0].attributeMultiplier).toBe(0)
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
      // A fixed window: the sole damaging hit alone would otherwise close the
      // fight's own window right where it lands, docs/TIMELINE.md § "Fight
      // window", leaving the poison's own projected uptime no runway to show.
      activeCustomRotation: makeRotation("bellstrikeUmbra", {
        name: "single-low-probability-hit",
        steps: [makeStep({ skillId: soleHit.id }), makeStep({ skillId: pad.id })],
        fixedWindowSec: 600 / 60,
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
    // A fixed break window shared by both runs, so Bitter Season Poison's own
    // Qi payout cannot move which cast lands inside it and so incidentally
    // move an unrelated row.
    const options = { fixedQiBreaks: [DEFAULT_QI_BREAK_WINDOW] }
    // Without Insightful Strike, whose Focus the poison's own ticks would build
    // and so lift every other row.
    const withoutAffinityTracking = (mindMethods: Inputs["mindMethods"]): Inputs["mindMethods"] =>
      mindMethods.map((slot) =>
        slot.name === "insightfulStrike" ? { name: "", stacks: "" } : slot,
      ) as Inputs["mindMethods"]
    const withoutBitterSeason = runEngine(
      {
        ...defaultInputs,
        classId: "bellstrikeUmbra",
        mindMethods: withoutAffinityTracking(UMBRA_BASE_MIND_METHODS),
        shareDebuff5HenZhi: true,
      },
      options,
    )
    const withBitterSeason = runEngine(
      {
        ...defaultInputs,
        classId: "bellstrikeUmbra",
        mindMethods: withoutAffinityTracking(withBitterSeasonAt("tier 6")),
        shareDebuff5HenZhi: true,
      },
      options,
    )
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

describe("BitterSeasonTracker under a parse run", () => {
  const hitsSec = Array.from({ length: 60 }, (_unused, index) => index * 0.3)

  it("averages 500 runs when given no rng", () => {
    const tracker = trackerAfter({ hitsSec, procChance: 0.15, poisonDurationSec: 5 })
    const fractional = Array.from({ length: 200 }, (_unused, step) =>
      tracker.expectedStacksAt(step * 0.05),
    ).filter((stacks) => !Number.isInteger(stacks))
    expect(fractional.length).toBeGreaterThan(0)
  })

  it("runs a single trajectory when given an rng", () => {
    const tracker = trackerAfter({
      hitsSec,
      procChance: 0.15,
      poisonDurationSec: 5,
      runRandom: mulberry32(404),
    })
    for (let step = 0; step < 200; step++) {
      const stacks = tracker.expectedStacksAt(step * 0.05)
      expect(Number.isInteger(stacks)).toBe(true)
      expect(stacks).toBeLessThanOrEqual(BITTER_SEASON_MAX_STACKS)
    }
  })
})

describe("BitterSeasonTracker grants stack and poison from one roll", () => {
  const scriptedDraws = (draws: readonly number[]) => {
    let consumed = 0
    return {
      draw: () => draws[consumed++ % draws.length]!,
      consumed: () => consumed,
    }
  }

  it("adds a stack and extends the poison together when the one draw procs", () => {
    const script = scriptedDraws([0.05])
    const tracker = new BitterSeasonTracker(0.1, script.draw, true)
    tracker.roll(1, 1, 5)
    expect(tracker.expectedStacksAt(1.5)).toBe(1)
    expect(tracker.poisonActiveProbAt(1.5)).toBe(1)
    expect(script.consumed()).toBe(1)
  })

  it("adds neither when the one draw misses", () => {
    const script = scriptedDraws([0.95])
    const tracker = new BitterSeasonTracker(0.1, script.draw, true)
    tracker.roll(1, 1, 5)
    expect(tracker.expectedStacksAt(1.5)).toBe(0)
    expect(tracker.poisonActiveProbAt(1.5)).toBe(0)
    expect(script.consumed()).toBe(1)
  })

  it("poisons exactly the trajectories that gained a stack on an unseeded run", () => {
    const tracker = new BitterSeasonTracker(0.2, undefined, true)
    tracker.roll(0, 1, 100)
    const poisoned = tracker.poisonActiveProbAt(0.1)
    expect(poisoned).toBeGreaterThan(0)
    expect(tracker.expectedStacksAt(0.1)).toBe(poisoned)
  })
})

const REFERENCE_SEED_OFFSET = 40217
const REFERENCE_RUNS = 500

interface ReferenceState {
  stacks: Float64Array
  stackEndSec: Float64Array
  poisonEndSec: Float64Array
}

class SnapshotBitterSeason {
  private readonly bank = new MulberryBank(REFERENCE_SEED_OFFSET, REFERENCE_RUNS)
  private readonly live: ReferenceState = {
    stacks: new Float64Array(REFERENCE_RUNS),
    stackEndSec: new Float64Array(REFERENCE_RUNS).fill(-Infinity),
    poisonEndSec: new Float64Array(REFERENCE_RUNS).fill(-Infinity),
  }
  private readonly history: { timeSec: number; state: ReferenceState }[] = []

  constructor(private readonly procChance: number) {}

  roll(timeSec: number, poisonDurationSec: number): void {
    for (let sim = 0; sim < REFERENCE_RUNS; sim++) {
      if (this.live.stacks[sim] > 0 && timeSec >= this.live.stackEndSec[sim])
        this.live.stacks[sim] = 0
      if (this.bank.next(sim) < this.procChance) {
        this.live.stacks[sim] = Math.min(this.live.stacks[sim] + 1, BITTER_SEASON_MAX_STACKS)
        this.live.stackEndSec[sim] = timeSec + 10
        this.live.poisonEndSec[sim] = Math.max(
          this.live.poisonEndSec[sim],
          timeSec + poisonDurationSec,
        )
      }
    }
    this.record(timeSec)
  }

  extendPoison(timeSec: number, maxRemainingSec: number): void {
    for (let sim = 0; sim < REFERENCE_RUNS; sim++) {
      const end = this.live.poisonEndSec[sim]
      if (end > timeSec)
        this.live.poisonEndSec[sim] = Math.max(end, Math.min(end + 10, timeSec + maxRemainingSec))
    }
    this.record(timeSec)
  }

  private record(timeSec: number): void {
    this.history.push({
      timeSec,
      state: {
        stacks: this.live.stacks.slice(),
        stackEndSec: this.live.stackEndSec.slice(),
        poisonEndSec: this.live.poisonEndSec.slice(),
      },
    })
  }

  private stateAt(timeSec: number): ReferenceState | null {
    const latest = this.history[this.history.length - 1]
    if (!latest || timeSec >= latest.timeSec) return this.live
    const earlier = this.history.filter((entry) => entry.timeSec <= timeSec)
    return earlier[earlier.length - 1]?.state ?? null
  }

  readings(timeSec: number) {
    const state = this.stateAt(timeSec)
    if (!state) return { expected: 0, atMax: 0, active: 0, remaining: 0 }
    let expected = 0
    let atMax = 0
    let active = 0
    let remaining = 0
    for (let sim = 0; sim < REFERENCE_RUNS; sim++) {
      if (state.stacks[sim] > 0 && timeSec < state.stackEndSec[sim]) {
        expected += state.stacks[sim]
        if (state.stacks[sim] === BITTER_SEASON_MAX_STACKS) atMax++
      }
      if (timeSec < state.poisonEndSec[sim]) active++
      remaining += Math.max(0, state.poisonEndSec[sim] - timeSec)
    }
    return {
      expected: expected / REFERENCE_RUNS,
      atMax: atMax / REFERENCE_RUNS,
      active: active / REFERENCE_RUNS,
      remaining: remaining / REFERENCE_RUNS,
    }
  }
}

describe("BitterSeasonTracker against a per-change snapshot reference", () => {
  it("answers every reading bit-identically, across checkpoint boundaries and past times", () => {
    const tracker = new BitterSeasonTracker(0.3, undefined, true)
    const reference = new SnapshotBitterSeason(0.3)
    const timing = mulberry32(77)
    const queries = mulberry32(8)
    let timeSec = 0.2
    for (let count = 0; count < 300; count++) {
      if (count % 11 === 5) {
        tracker.extendPoison(timeSec, ZENITH_CAP_SEC)
        reference.extendPoison(timeSec, ZENITH_CAP_SEC)
      } else {
        tracker.roll(timeSec, 1, 6)
        reference.roll(timeSec, 6)
      }
      for (const queryTime of [timeSec, timeSec + queries() * 15, queries() * timeSec]) {
        const expected = reference.readings(queryTime)
        expect(tracker.expectedStacksAt(queryTime)).toBe(expected.expected)
        expect(tracker.maxStackProbAt(queryTime)).toBe(expected.atMax)
        expect(tracker.poisonActiveProbAt(queryTime)).toBe(expected.active)
        expect(tracker.poisonRemainingSecAt(queryTime)).toBe(expected.remaining)
      }
      timeSec += timing() < 0.1 ? 0 : timing() * (timing() < 0.1 ? 14 : 0.7)
    }
  })
})
