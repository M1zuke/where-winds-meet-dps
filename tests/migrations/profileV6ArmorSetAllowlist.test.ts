// Additive, no version bump — see MIGRATIONS.md § "What counts". Dropping
// Ivorybloom and Rainwhisper narrowed the armor-set allowlist, so `hydrateInputs`
// clears a stored `set` outside `ARMOR_SET_OPTIONS`. Nothing errors on a stale
// value — every lookup (`applyArmorSet`, `setValue`, `APP_SET_TO_SITE_SET`) just
// misses — so without this pass the profile keeps round-tripping a set the
// picker cannot show.
import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { applyArmorSet, applyBowSet, ARMOR_SET_OPTIONS } from "../../src/engine/panel"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import type { StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/profile-v6.json"

const PROFILES_KEY = "wwm.profiles"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function withSet(profile: StoredProfile, set: string | null): StoredProfile {
  return { ...profile, inputs: { ...profile.inputs, set } }
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

describe("profile-v6 fixture", () => {
  it("is v6 and still carries a set the picker offered before the removal", () => {
    expect(LEGACY.v).toBe(6)
    expect(LEGACY.profile.inputs.classId).toBe("bellstrikeUmbra")
    expect(LEGACY.profile.inputs.set).toBe("Hawking")
  })
})

describe("armor-set allowlist — a removed set is cleared, a surviving one is not", () => {
  beforeEach(() => localStorage.clear())

  for (const removed of ["Ivorybloom", "Rainwhisper", "Rainwhisper (no shield)"]) {
    it(`clears a stored ${removed}`, () => {
      writeProfile(withSet(clone(LEGACY.profile), removed))
      expect(loadOne().inputs.set).toBeNull()
    })
  }

  for (const option of ARMOR_SET_OPTIONS) {
    it(`leaves ${option.setKey} untouched`, () => {
      writeProfile(withSet(clone(LEGACY.profile), option.setKey))
      expect(loadOne().inputs.set).toBe(option.setKey)
    })
  }

  it("leaves an already-unset profile at null", () => {
    writeProfile(withSet(clone(LEGACY.profile), null))
    expect(loadOne().inputs.set).toBeNull()
  })
})

describe("clearing the set costs the user nothing else", () => {
  beforeEach(() => localStorage.clear())

  // Compared against the same fixture loaded with a surviving set rather than
  // against the raw fixture: v6 does not persist the derived panel stats, and
  // hydration injects its own defaults, so only this pairing isolates `set`.
  it("changes nothing but the set — every other field matches a Hawking load of the same build", () => {
    writeProfile(withSet(clone(LEGACY.profile), "Hawking"))
    const kept = loadOne()

    localStorage.clear()
    writeProfile(withSet(clone(LEGACY.profile), "Ivorybloom"))
    const cleared = loadOne()

    expect(cleared.inputs.set).toBeNull()
    expect({ ...cleared.inputs, set: kept.inputs.set }).toEqual(kept.inputs)
    expect(cleared.id).toBe(kept.id)
    expect(cleared.name).toBe(LEGACY.profile.name)
    expect(cleared.inputs.inventory).toHaveLength(LEGACY.profile.inputs.inventory.length)
  })

  it("still computes a positive-DPS run", () => {
    writeProfile(withSet(clone(LEGACY.profile), "Rainwhisper"))
    const after = loadOne()
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(after.inputs))))
    expect(result.dps).toBeGreaterThan(0)
  })

  it("is idempotent across repeated loads", () => {
    writeProfile(withSet(clone(LEGACY.profile), "Ivorybloom"))
    const once = loadOne()
    writeProfile(clone(once))
    expect(loadOne()).toEqual(once)
  })
})

describe("importProfile applies the same allowlist", () => {
  beforeEach(() => localStorage.clear())

  it("clears a removed set on an imported wrapper", () => {
    const wrapper = { v: LEGACY.v, profile: withSet(clone(LEGACY.profile), "Ivorybloom") }
    expect(importProfile(JSON.stringify(wrapper)).inputs.set).toBeNull()
  })

  it("keeps a surviving set on an imported wrapper", () => {
    const wrapper = { v: LEGACY.v, profile: withSet(clone(LEGACY.profile), "Jadeware") }
    expect(importProfile(JSON.stringify(wrapper)).inputs.set).toBe("Jadeware")
  })
})
