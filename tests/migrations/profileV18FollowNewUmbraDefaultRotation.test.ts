import { beforeEach, describe, expect, it } from "vitest"
import { builtinRotationsForClass, defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { activeRotationForInputs } from "../../src/engine/dps"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V18__followNewUmbraDefaultRotation,
  dropRetiredRotationId,
} from "../../src/migrations/V18__followNewUmbraDefaultRotation"
import { importProfile } from "../../src/storage"
import legacyProfileFile from "./testProfiles/v17/bellstrikeUmbra.json"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile
const RETIRED_ID = "builtin-bellstrikeUmbra-t6-bili"
const PREVIOUS_DEFAULT_ID = "builtin-bellstrikeUmbra-36-bbs"
const NEW_DEFAULT_ID = "builtin-bellstrikeUmbra-38-bbs"

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id }
}

function profileOf(blob: RawProfilesBlob): StoredProfile {
  return blob.profiles[0] as StoredProfile
}

function profileSelecting(rotationId: string | null): StoredProfile {
  const profile = clone(LEGACY.profile)
  profile.inputs.selectedBuiltinRotationId = rotationId
  return profile
}

function migrated(rotationId: string | null): Inputs {
  return profileOf(V18__followNewUmbraDefaultRotation.migrate(blobOf(profileSelecting(rotationId))))
    .inputs
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v17, the version this step reads", () => {
    expect(LEGACY.v).toBe(17)
    expect(LEGACY.v).toBe(V18__followNewUmbraDefaultRotation.to - 1)
  })
})

describe("the rotation pool this step follows", () => {
  it("drops the four retired rotations and defaults to the new one", () => {
    const offered = builtinRotationsForClass("bellstrikeUmbra").map((rotation) => rotation.id)
    expect(offered).not.toContain("builtin-bellstrikeUmbra-eazy")
    expect(offered).not.toContain("builtin-bellstrikeUmbra-eazy-t6-wolf")
    expect(offered).not.toContain("builtin-bellstrikeUmbra-focus-t6-wolf")
    expect(offered).not.toContain(RETIRED_ID)
    expect(defaultRotationForClass("bellstrikeUmbra")?.id).toBe(NEW_DEFAULT_ID)
  })

  it("still offers the previous default as a choice", () => {
    const offered = builtinRotationsForClass("bellstrikeUmbra").map((rotation) => rotation.id)
    expect(offered).toContain(PREVIOUS_DEFAULT_ID)
  })
})

describe("V18__followNewUmbraDefaultRotation — called directly", () => {
  it("moves a profile pinned to the previous default onto the new one", () => {
    expect(migrated(PREVIOUS_DEFAULT_ID).selectedBuiltinRotationId).toBeNull()
    expect(activeRotationForInputs(migrated(PREVIOUS_DEFAULT_ID))?.id).toBe(NEW_DEFAULT_ID)
  })

  it("moves a profile on a rotation the picker can no longer show onto the new default", () => {
    expect(migrated(RETIRED_ID).selectedBuiltinRotationId).toBeNull()
    expect(activeRotationForInputs(migrated(RETIRED_ID))?.id).toBe(NEW_DEFAULT_ID)
  })

  it("already follows the new default when nothing was pinned", () => {
    expect(activeRotationForInputs(migrated(null))?.id).toBe(NEW_DEFAULT_ID)
  })

  it("leaves a selection that still resolves alone", () => {
    const kept = LEGACY.profile.inputs.selectedBuiltinRotationId
    expect(kept).not.toBeNull()
    expect(migrated(kept!).selectedBuiltinRotationId).toBe(kept)
  })

  it("touches nothing else in the profile", () => {
    const before = profileSelecting(RETIRED_ID)
    const after = profileOf(V18__followNewUmbraDefaultRotation.migrate(blobOf(clone(before))))
    expect(after).toEqual({
      ...before,
      inputs: { ...before.inputs, selectedBuiltinRotationId: null },
    })
  })

  it("does not mutate its input", () => {
    const input = blobOf(profileSelecting(RETIRED_ID))
    const snapshot = clone(input)
    V18__followNewUmbraDefaultRotation.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is idempotent", () => {
    const once = V18__followNewUmbraDefaultRotation.migrate(blobOf(profileSelecting(RETIRED_ID)))
    expect(V18__followNewUmbraDefaultRotation.migrate(clone(once))).toEqual(once)
  })
})

describe("V18__followNewUmbraDefaultRotation — registered in the chain", () => {
  it("a v17 blob migrated to v18 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(profileSelecting(PREVIOUS_DEFAULT_ID)), {
      toVersion: 18,
    })!
    expect(result.applied).toEqual(["V18__followNewUmbraDefaultRotation"])
    expect(result.blob.v).toBe(18)
    expect(profileOf(result.blob).inputs.selectedBuiltinRotationId).toBeNull()
  })
})

describe("hydrateInputs backstop — a bare import never walks the chain", () => {
  beforeEach(() => localStorage.clear())

  it("still clears a rotation the picker can no longer show", () => {
    const imported = importProfile(JSON.stringify(profileSelecting(RETIRED_ID)))
    expect(imported.inputs.selectedBuiltinRotationId).toBeNull()
  })

  it("keeps the previous default, so picking it today survives the next load", () => {
    const imported = importProfile(JSON.stringify(profileSelecting(PREVIOUS_DEFAULT_ID)))
    expect(imported.inputs.selectedBuiltinRotationId).toBe(PREVIOUS_DEFAULT_ID)
  })

  it("keeps a selection that still resolves", () => {
    const imported = importProfile(JSON.stringify(clone(LEGACY.profile)))
    expect(imported.inputs.selectedBuiltinRotationId).toBe(
      LEGACY.profile.inputs.selectedBuiltinRotationId,
    )
  })
})

describe("dropRetiredRotationId — the hydrator's half, retired ids only", () => {
  it("clears every retired id", () => {
    expect(dropRetiredRotationId(RETIRED_ID)).toBeNull()
    expect(dropRetiredRotationId("builtin-bellstrikeUmbra-eazy")).toBeNull()
    expect(dropRetiredRotationId("builtin-bellstrikeUmbra-eazy-t6-wolf")).toBeNull()
    expect(dropRetiredRotationId("builtin-bellstrikeUmbra-focus-t6-wolf")).toBeNull()
  })

  it("leaves the previous default, the new default and unrelated values unchanged", () => {
    expect(dropRetiredRotationId(PREVIOUS_DEFAULT_ID)).toBe(PREVIOUS_DEFAULT_ID)
    expect(dropRetiredRotationId(NEW_DEFAULT_ID)).toBe(NEW_DEFAULT_ID)
    expect(dropRetiredRotationId("builtin-silkbindJade-t5")).toBe("builtin-silkbindJade-t5")
    expect(dropRetiredRotationId(null)).toBeNull()
    expect(dropRetiredRotationId(undefined)).toBeUndefined()
  })
})
