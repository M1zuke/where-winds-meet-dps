// Additive, no version bump — see MIGRATIONS.md. Widening Bitter Season's
// tier dropdown to all six tiers (previously only tier 5 / tier 6) never
// needed a migration: `hydrateInputs` never validated the `stacks` string
// against an allowlist, so a value the UI could not have produced before
// (e.g. "tier 3") already round-tripped untouched, and continues to.
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { loadProfiles } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { defaultInputs } from "../../src/engine/defaults"
import { LATEST_PROFILES_VERSION } from "../../src/migrations"
import { kvStore } from "../../src/kvStore"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/profile-v6.json"

const PROFILES_KEY = "wwm.profiles"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function writeProfile(profile: StoredProfile): void {
  localStorage.setItem(
    PROFILES_KEY,
    JSON.stringify({ v: LEGACY.v, profiles: [profile], activeId: profile.id }),
  )
}

function loadOne(): StoredProfile {
  const { profiles } = loadProfiles()
  expect(profiles).toHaveLength(1)
  return profiles[0]
}

function withBitterSeasonAtTier3(profile: StoredProfile): StoredProfile {
  return {
    ...profile,
    inputs: {
      ...profile.inputs,
      mindMethods: [
        { name: "Bitter Season", stacks: "tier 3" },
        profile.inputs.mindMethods[1],
        profile.inputs.mindMethods[2],
        profile.inputs.mindMethods[3],
      ] as StoredProfile["inputs"]["mindMethods"],
    },
  }
}

describe("profile-v6 fixture", () => {
  it("is v6 and is the Umbra build these tests assume", () => {
    expect(LEGACY.v).toBe(6)
    expect(LEGACY.profile.inputs.classId).toBe("bellstrikeUmbra")
  })
})

describe("profile-v6 (real fixture, unmodified) survives the widened tier dropdown untouched", () => {
  beforeEach(() => localStorage.clear())

  it("round-trips its mind methods exactly and still computes positive DPS", () => {
    writeProfile(clone(LEGACY.profile))
    const after = loadOne()
    // The selection and tier survive; the heal adds the stable id the slot
    // predates (see storage.ts § mindMethods).
    expect(
      after.inputs.mindMethods.map((slot) => ({ name: slot.name, stacks: slot.stacks })),
    ).toEqual(LEGACY.profile.inputs.mindMethods)
    for (const slot of after.inputs.mindMethods) {
      if (slot.name) expect(slot.id, slot.name).toBeTruthy()
    }
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(after.inputs))))
    expect(result.dps).toBeGreaterThan(0)
  })
})

describe("profile-v6 with a slot at a tier only reachable via the widened Bitter Season dropdown", () => {
  beforeEach(() => localStorage.clear())

  it("survives hydration with its id healed — 'tier 3' is not clamped or cleared", () => {
    writeProfile(withBitterSeasonAtTier3(clone(LEGACY.profile)))
    const after = loadOne()
    expect(after.inputs.mindMethods[0]).toEqual({
      id: "bitterSeason",
      name: "Bitter Season",
      stacks: "tier 3",
    })
  })

  it("still computes a valid, positive-DPS run with the rest of the real build intact", () => {
    writeProfile(withBitterSeasonAtTier3(clone(LEGACY.profile)))
    const after = loadOne()
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(after.inputs))))
    expect(result.dps).toBeGreaterThan(0)
  })

  it("is idempotent across repeated loads", () => {
    writeProfile(withBitterSeasonAtTier3(clone(LEGACY.profile)))
    const once = loadOne()
    writeProfile(clone(once))
    expect(loadOne()).toEqual(once)
  })
})

// Additive, no version bump — see MIGRATIONS.md. Widening the inner-way NAME
// allowlist (`ClassDef.allowedMindMethods`) to include Bitter Season on every
// class can only make previously-illegal slot values legal, never the
// reverse.
describe("Bitter Season inner way — widened allowlist round-trips (no version bump)", () => {
  beforeEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })
  afterEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })

  function withBitterSeasonSlot(classId: string): Inputs {
    return {
      ...defaultInputs,
      classId,
      mindMethods: [
        { name: "Bitter Season", stacks: "tier 6" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ] as Inputs["mindMethods"],
    }
  }

  it("a Bellstrike Umbra profile holding Bitter Season survives hydration with its id healed", () => {
    const inputs = withBitterSeasonSlot("bellstrikeUmbra")
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: LATEST_PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Profile", inputs }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.mindMethods[0]).toEqual({
      id: "bitterSeason",
      name: "Bitter Season",
      stacks: "tier 6",
    })
  })

  // A profile naming a class that no longer exists degrades that classId to
  // Bellstrike Umbra (CLAUDE.md § "localStorage migrations") before the
  // inner-way heal below runs — Bitter Season being global-allowed continues
  // to hold on the degraded class too.
  it("survives hydration with its id healed on a profile whose classId gets degraded", () => {
    const inputs = withBitterSeasonSlot("silkbindJade")
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: LATEST_PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Profile", inputs }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.classId).toBe("bellstrikeUmbra")
    expect(profiles[0].inputs.mindMethods[0]).toEqual({
      id: "bitterSeason",
      name: "Bitter Season",
      stacks: "tier 6",
    })
  })

  it("is idempotent across repeated hydration", () => {
    const inputs = withBitterSeasonSlot("bellstrikeUmbra")
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: LATEST_PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Profile", inputs }],
        activeId: "p1",
      }),
    )

    const first = loadProfiles()
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: LATEST_PROFILES_VERSION,
        profiles: first.profiles,
        activeId: first.activeId,
      }),
    )
    const second = loadProfiles()
    expect(second.profiles[0].inputs.mindMethods[0]).toEqual({
      id: "bitterSeason",
      name: "Bitter Season",
      stacks: "tier 6",
    })
  })

  it("leaves the default build's mind-method slots untouched", () => {
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.mindMethods).toEqual(defaultInputs.mindMethods)
  })
})
