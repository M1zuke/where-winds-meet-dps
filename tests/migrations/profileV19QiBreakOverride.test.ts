import { beforeEach, describe, expect, it } from "vitest"
import type { StoredProfile } from "../../src/engine/types"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V19__qiBreakOverride,
  qiBreakOverrideFrom,
} from "../../src/migrations/V19__qiBreakOverride"
import { importProfile } from "../../src/storage"
import legacyProfileFile from "./testProfiles/v18/bellstrikeUmbra.json"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

type LegacyCombat = Record<string, unknown>

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id }
}

function profileOf(blob: RawProfilesBlob): StoredProfile {
  return blob.profiles[0] as StoredProfile
}

function legacyCombat(profile: StoredProfile): LegacyCombat {
  return profile.inputs.combatSettings as unknown as LegacyCombat
}

function profileWithQiBreak(qiBreak: unknown): StoredProfile {
  const profile = clone(LEGACY.profile)
  ;(profile.inputs.combatSettings as unknown as LegacyCombat).qiBreak = qiBreak
  return profile
}

function migrated(qiBreak: unknown): StoredProfile {
  return profileOf(V19__qiBreakOverride.migrate(blobOf(profileWithQiBreak(qiBreak))))
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v18, the version this step reads", () => {
    expect(LEGACY.v).toBe(18)
    expect(LEGACY.v).toBe(V19__qiBreakOverride.to - 1)
  })

  it("still carries the old `qiBreak` shape and no override", () => {
    const combat = legacyCombat(LEGACY.profile)
    expect(combat.qiBreak).toBeDefined()
    expect("qiBreakOverride" in combat).toBe(false)
  })

  it("carries a window the old app default never produced, so the match branch is real", () => {
    expect((combatQiBreak() as Record<string, unknown>).startSec).toBe(34)
    expect(LEGACY.profile.inputs.selectedBuiltinRotationId).toBe(
      "builtin-bellstrikeUmbra-nox-1m-dh",
    )
  })
})

function combatQiBreak(): unknown {
  return legacyCombat(LEGACY.profile).qiBreak
}

describe("V19__qiBreakOverride — called directly", () => {
  it("leaves no override when the stored window is what the profile's rotation now runs", () => {
    expect(legacyCombat(migrated(combatQiBreak())).qiBreakOverride).toBeNull()
  })

  it("drops the old key rather than leaving both shapes on the blob", () => {
    expect("qiBreak" in legacyCombat(migrated(combatQiBreak()))).toBe(false)
  })

  it("leaves no override on a profile that never edited the window", () => {
    const combat = legacyCombat(
      migrated({ enabled: true, startSec: 25, durationSec: 10, lowQiLeadSec: 5 }),
    )
    expect(combat.qiBreakOverride).toBeNull()
  })

  it("keeps a window that matches neither the old default nor the rotation", () => {
    const combat = legacyCombat(
      migrated({ enabled: true, startSec: 20, durationSec: 8, lowQiLeadSec: 2 }),
    )
    expect(combat.qiBreakOverride).toEqual({ startSec: 20, durationSec: 8, lowQiLeadSec: 2 })
  })

  it("turns `enabled: false` into a zero-length override, honouring it everywhere", () => {
    const combat = legacyCombat(
      migrated({ enabled: false, startSec: 25, durationSec: 10, lowQiLeadSec: 5 }),
    )
    expect(combat.qiBreakOverride).toEqual({ startSec: 25, durationSec: 0, lowQiLeadSec: 5 })
  })

  it("keeps the rest of the combat settings and the rest of the build intact", () => {
    const before = profileWithQiBreak(combatQiBreak())
    const after = migrated(combatQiBreak())
    expect(after.id).toBe(before.id)
    expect(after.inputs.equipped).toEqual(before.inputs.equipped)
    expect(after.inputs.set).toBe(before.inputs.set)
    expect(after.inputs.mindMethods).toEqual(before.inputs.mindMethods)
    expect(after.inputs.selectedBuiltinRotationId).toBe(before.inputs.selectedBuiltinRotationId)
    const beforeCombat = legacyCombat(before)
    const afterCombat = legacyCombat(after)
    for (const key of Object.keys(beforeCombat)) {
      if (key === "qiBreak") continue
      expect(afterCombat[key], key).toEqual(beforeCombat[key])
    }
  })

  it("does not mutate its input", () => {
    const input = blobOf(profileWithQiBreak(combatQiBreak()))
    const snapshot = clone(input)
    V19__qiBreakOverride.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is idempotent", () => {
    const once = V19__qiBreakOverride.migrate(blobOf(profileWithQiBreak(combatQiBreak())))
    expect(V19__qiBreakOverride.migrate(clone(once))).toEqual(once)
  })
})

describe("V19__qiBreakOverride — registered in the chain", () => {
  it("a v18 blob migrated to v19 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(profileWithQiBreak(combatQiBreak())), {
      toVersion: 19,
    })!
    expect(result.applied).toEqual(["V19__qiBreakOverride"])
    expect(result.blob.v).toBe(19)
    expect(legacyCombat(profileOf(result.blob)).qiBreakOverride).toBeNull()
    expect("qiBreak" in legacyCombat(profileOf(result.blob))).toBe(false)
  })
})

describe("qiBreakOverrideFrom — the hydrator's half", () => {
  it("reads an already-migrated override straight back", () => {
    const window = { startSec: 18, durationSec: 12, lowQiLeadSec: 4 }
    expect(qiBreakOverrideFrom({ qiBreakOverride: window })).toEqual(window)
    expect(qiBreakOverrideFrom({ qiBreakOverride: null })).toBeNull()
  })

  it("backfills a missing low-Qi lead on a window saved before it existed", () => {
    expect(
      qiBreakOverrideFrom({ qiBreak: { enabled: true, startSec: 30, durationSec: 12 } }),
    ).toEqual({ startSec: 30, durationSec: 12, lowQiLeadSec: 5 })
  })

  it("degrades rather than throwing on anything unreadable", () => {
    expect(qiBreakOverrideFrom(undefined)).toBeNull()
    expect(qiBreakOverrideFrom("not-an-object")).toBeNull()
    expect(qiBreakOverrideFrom({})).toBeNull()
    expect(qiBreakOverrideFrom({ qiBreak: "nonsense" })).toBeNull()
  })

  it("heals an unreadable field to the old default, which then reads as no override", () => {
    expect(qiBreakOverrideFrom({ qiBreak: { enabled: true, startSec: -4 } })).toBeNull()
  })

  it("keeps a window whose readable fields still differ from the old default", () => {
    expect(
      qiBreakOverrideFrom({ qiBreak: { enabled: true, startSec: "x", durationSec: 12 } }),
    ).toEqual({ startSec: 25, durationSec: 12, lowQiLeadSec: 5 })
  })
})

describe("hydrateInputs backstop — a bare import never walks the chain", () => {
  beforeEach(() => localStorage.clear())

  it("still converts a legacy window on an imported profile", () => {
    const imported = importProfile(JSON.stringify(profileWithQiBreak(combatQiBreak())))
    expect(imported.inputs.combatSettings!.qiBreakOverride).toBeNull()
    expect("qiBreak" in imported.inputs.combatSettings!).toBe(false)
  })

  it("keeps a genuinely deliberate window on an imported profile", () => {
    const imported = importProfile(
      JSON.stringify(
        profileWithQiBreak({ enabled: true, startSec: 20, durationSec: 8, lowQiLeadSec: 2 }),
      ),
    )
    expect(imported.inputs.combatSettings!.qiBreakOverride).toEqual({
      startSec: 20,
      durationSec: 8,
      lowQiLeadSec: 2,
    })
  })

  it("leaves an untouched legacy window as no override", () => {
    const imported = importProfile(
      JSON.stringify(
        profileWithQiBreak({ enabled: true, startSec: 25, durationSec: 10, lowQiLeadSec: 5 }),
      ),
    )
    expect(imported.inputs.combatSettings!.qiBreakOverride).toBeNull()
  })
})
