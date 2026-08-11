// Refactor guard, NOT a correctness anchor — see docs/TESTING.md § "The engine
// baseline". These numbers carry no external
// authority: they exist so a behaviour-preserving refactor can prove it
// preserved behaviour. Re-baseline (UPDATE_ENGINE_BASELINE=1) only when a
// change to the engine's output is intended and justified in the same commit.
//
// Scoped to Bellstrike Umbra — see CLASSES.md § "Implemented classes".
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { loadProfiles } from "../../src/storage"
import { defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { SET_ID } from "../../src/data/sets/ids"
import type { Inputs, Result } from "../../src/engine/types"
import anchorProfileFile from "../migrations/testProfiles/profile-v7.json"

// `import.meta.url` is an http URL under the jsdom environment, so the fixture
// is resolved from the vitest root instead.
const FIXTURE_PATH = join(process.cwd(), "tests/engine/engineBaseline.fixture.json")
const REGENERATE = process.env.UPDATE_ENGINE_BASELINE === "1"
const PROFILES_KEY = "wwm.profiles"

interface ProfileFile {
  v: number
  profile: { id: string; name: string; inputs: Record<string, unknown> }
}
const ANCHOR_FILE = anchorProfileFile as unknown as ProfileFile

// A saved profile carries no derived stats (V6 dropped them), so the stored
// `inputs` cannot be handed to the engine directly — this is App.tsx's pipeline.
function anchorInputs(): Inputs {
  localStorage.clear()
  localStorage.setItem(
    PROFILES_KEY,
    JSON.stringify({
      v: ANCHOR_FILE.v,
      profiles: [ANCHOR_FILE.profile],
      activeId: ANCHOR_FILE.profile.id,
    }),
  )
  return loadProfiles().profiles[0].inputs
}

function toEngineInputs(raw: Inputs): Inputs {
  return applyBowSet(applyArmorSet(withDerivedStats(raw)))
}

function withInnerWay(
  raw: Inputs,
  replace: string,
  next: { name: string; stacks: string },
): Inputs {
  const slots = raw.mindMethods.map((slot) =>
    slot.name === replace ? { ...next } : { ...slot },
  ) as Inputs["mindMethods"]
  return { ...raw, mindMethods: slots }
}

function withoutInnerWay(raw: Inputs, name: string): Inputs {
  return withInnerWay(raw, name, { name: "", stacks: "" })
}

function withCombat(raw: Inputs, patch: Partial<NonNullable<Inputs["combatSettings"]>>): Inputs {
  return { ...raw, combatSettings: { ...raw.combatSettings!, ...patch } }
}

// Inserts one extra cast into whatever rotation the build already resolves to
// (its own `activeCustomRotation`, or the class default) — for exercising a
// skill the anchor rotation never casts on its own. Placed after the pre-pull
// steps rather than appended, so a buff the cast grants still has most of the
// rotation left to affect; appended at the end it would barely register.
//
// The step id is a literal because `makeStep` derives one from `Date.now()` and
// `Math.random()`, and a cast's `stepId` reaches the result `digestOf` hashes —
// a generated id makes the recorded digest unreproducible.
function withStepAfterPrePull(raw: Inputs, skillId: string): Inputs {
  const rotation = raw.activeCustomRotation ?? defaultRotationForClass(raw.classId)!
  const steps = [...rotation.steps]
  const firstNonPrePull = steps.findIndex((step) => !step.prePull)
  steps.splice(firstNonPrePull < 0 ? steps.length : firstNonPrePull, 0, {
    id: `st-baseline-${skillId}`,
    skillId,
    hitCount: 1,
    prePull: false,
  })
  return { ...raw, activeCustomRotation: { ...rotation, steps } }
}

// The case-name suffix is the pre-migration display name, kept exactly as the
// recorded fixture keys it — only the `set` value building each case's
// `Inputs` moved from the name to the id.
const ARMOUR_SETS: readonly [label: string, id: string][] = [
  ["Jadeware", SET_ID.jadeware],
  ["Rainwhisper", SET_ID.rainwhisper],
  ["Ivorybloom", SET_ID.ivorybloom],
  ["Mistwillow", SET_ID.mistwillow],
  ["StarsAlign", SET_ID.starsAlign],
  ["ShatteredRidge", SET_ID.shatteredRidge],
  ["Swallowcall", SET_ID.swallowcall],
  ["SwayingHeights", SET_ID.swayingHeights],
]

const CASES: { name: string; build: () => Inputs }[] = [
  { name: "anchor", build: () => toEngineInputs(anchorInputs()) },
  // Isolates the bleed attunement channel: the only rows that may differ from
  // `anchor` are the two `attune:bleed` entities.
  {
    name: "anchor:noAttunement",
    build: () => ({ ...toEngineInputs(anchorInputs()), dingYinByTag: {} }),
  },
  { name: "anchor:dummyOff", build: () => toEngineInputs({ ...anchorInputs(), dummyMode: false }) },
  {
    name: "anchor:noQiBreak",
    build: () => {
      const raw = anchorInputs()
      return toEngineInputs(
        withCombat(raw, { qiBreak: { ...raw.combatSettings!.qiBreak, enabled: false } }),
      )
    },
  },
  {
    name: "anchor:healerBuff",
    build: () => toEngineInputs(withCombat(anchorInputs(), { healerBuff: true })),
  },
  {
    name: "anchor:revelryScript",
    build: () => toEngineInputs(withCombat(anchorInputs(), { revelryScript: true })),
  },
  {
    name: "anchor:breakExtension",
    build: () => toEngineInputs(withCombat(anchorInputs(), { breakExtension: true })),
  },
  {
    name: "anchor:swordHorizonT1",
    build: () =>
      toEngineInputs(
        withInnerWay(anchorInputs(), "Sword Horizon", { name: "Sword Horizon", stacks: "tier 1" }),
      ),
  },
  {
    name: "anchor:noSwordHorizon",
    build: () => toEngineInputs(withoutInnerWay(anchorInputs(), "Sword Horizon")),
  },
  {
    name: "anchor:noInsightfulStrike",
    build: () => toEngineInputs(withoutInnerWay(anchorInputs(), "Insightful Strike")),
  },
  {
    name: "anchor:noMoraleChant",
    build: () => toEngineInputs(withoutInnerWay(anchorInputs(), "Morale Chant")),
  },
  // The anchor rotation never casts SpearHeavy on its own, so without this the
  // baseline is silent on Soul Shaken's Spear Heavy trigger set — the one path
  // its BuffDef → BuffModule conversion changes numerically, since the
  // converted module gates Spear Heavy behind the same Wolfchaser's Art
  // tier-6 requirement as Spear Q instead of leaving it ungated.
  {
    name: "anchor:spearHeavyNoWolfchasersArt",
    build: () =>
      toEngineInputs(
        withStepAfterPrePull(
          withoutInnerWay(anchorInputs(), "Wolfchaser's Art"),
          "bellstrikeUmbra-spearheavy",
        ),
      ),
  },
  {
    name: "anchor:bitterSeasonT6",
    build: () =>
      toEngineInputs(
        withInnerWay(anchorInputs(), "Wolfchaser's Art", {
          name: "Bitter Season",
          stacks: "tier 6",
        }),
      ),
  },
  {
    name: "anchor:bitterSeasonT4",
    build: () =>
      toEngineInputs(
        withInnerWay(anchorInputs(), "Wolfchaser's Art", {
          name: "Bitter Season",
          stacks: "tier 4",
        }),
      ),
  },
  {
    name: "anchor:bitterSeasonT1",
    build: () =>
      toEngineInputs(
        withInnerWay(anchorInputs(), "Wolfchaser's Art", {
          name: "Bitter Season",
          stacks: "tier 1",
        }),
      ),
  },
  { name: "anchor:noSet", build: () => toEngineInputs({ ...anchorInputs(), set: null }) },
  ...ARMOUR_SETS.map(([label, id]) => ({
    name: `anchor:set-${label}`,
    build: () => toEngineInputs({ ...anchorInputs(), set: id }),
  })),
  // A second rotation, so the guard is not tied to one cast list.
  { name: "defaults:umbra", build: () => ({ ...defaultInputs, classId: "bellstrikeUmbra" }) },
]

function round(value: number, places: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(places)) : value
}

function digestOf(result: Result): string {
  const canonical = JSON.stringify(result, (_key, value) =>
    typeof value === "number" ? round(value, 10) : value,
  )
  return createHash("sha256").update(canonical).digest("hex")
}

function summarize(result: Result) {
  return {
    dps: round(result.dps, 6),
    totalDamage: round(result.totalDamage, 6),
    rotationDuration: round(result.rotationDuration, 6),
    warnings: result.warnings,
    perSkill: result.perSkill.map((row) => ({
      name: row.name,
      type: row.type,
      count: row.count,
      expectedDamage: round(row.expectedDamage, 6),
      castCount: row.castCount ?? 0,
      castTimeSec: round(row.castTimeSec ?? 0, 6),
    })),
    counts: {
      timeline: result.timeline?.length ?? 0,
      buffWindows: result.buffWindows?.length ?? 0,
      casts: result.casts?.length ?? 0,
    },
    digest: digestOf(result),
  }
}

type Baseline = Record<string, ReturnType<typeof summarize>>

function currentBaseline(): Baseline {
  const out: Baseline = {}
  for (const testCase of CASES) out[testCase.name] = summarize(runEngine(testCase.build()))
  return out
}

if (REGENERATE) {
  writeFileSync(FIXTURE_PATH, JSON.stringify(currentBaseline(), null, 2) + "\n")
}

describe("engine baseline", () => {
  const recorded = existsSync(FIXTURE_PATH)
    ? (JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as Baseline)
    : null

  it("has a recorded fixture", () => {
    expect(
      recorded,
      "engineBaseline.fixture.json missing — regenerate with UPDATE_ENGINE_BASELINE=1",
    ).not.toBeNull()
  })

  it("covers every case, with no stale entries", () => {
    expect(Object.keys(recorded!).sort()).toEqual(CASES.map((c) => c.name).sort())
  })

  for (const testCase of CASES) {
    it(`${testCase.name} is unchanged`, () => {
      expect(summarize(runEngine(testCase.build()))).toEqual(recorded![testCase.name])
    })
  }
})

// The figures the plan promises will not move. Spelled out separately from the
// fixture so a re-baseline cannot silently take them with it.
describe("engine baseline — profile-v7 anchor", () => {
  const result = runEngine(toEngineInputs(anchorInputs()))
  const damageOf = (name: string) =>
    round(result.perSkill.find((row) => row.name === name)?.expectedDamage ?? NaN, 2)

  it("still reports the user-verified rotation figures", () => {
    expect(round(result.dps, 2)).toBe(74381.62)
    expect(round(result.totalDamage, 2)).toBe(4285621.21)
    expect(round(result.rotationDuration, 4)).toBe(57.6167)
    expect(result.warnings).toEqual([])
  })

  // The two `attune:bleed` entities — the only rows P1 may touch, and it must
  // move neither.
  it("still reports the bleed rows P1 relocates the attunement for", () => {
    expect(damageOf("Bleed Detonation")).toBe(2151043.26)
    expect(damageOf("Bleed Tick (DoT)")).toBe(277096.22)
  })

  // DoT rows WITHOUT the attunement — these prove the new join does not
  // over-reach into every DoT.
  it("still reports the un-attuned DoT rows", () => {
    expect(damageOf("Smolder (DoT)")).toBe(379504.6)
    expect(damageOf("Flute Ripple (DoT)")).toBe(87721.3)
  })

  // Exists only via the Morale Chant tier-6 branch that P7 relocates.
  it("still reports Yi River", () => {
    expect(damageOf("Yi River")).toBe(49060.89)
  })
})
