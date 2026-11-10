import { beforeEach, describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  SPLENDOR_ATTUNEMENT_RENAMES,
  V35__splendorAttunementIds,
  migrateSplendorAttuneTag,
  migrateSplendorAttunementId,
  splitSplendorAttunements,
} from "../../src/migrations/V35__splendorAttunementIds"
import { loadProfiles } from "../../src/storage"
import { getAttunement } from "../../src/engine/attunements"
import { buildContext } from "../../src/engine/panel"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { classDefinition } from "../../src/definitions/classes/registry"
import type { StoredProfile } from "../../src/engine/types"
import splendorFile from "./testProfiles/v34/bellstrikeSplendor.json"
import umbraFile from "./testProfiles/v34/bellstrikeUmbra.json"
import jadeFile from "./testProfiles/v34/silkbindJade.json"

type CapturedFile = { v: number; profile: StoredProfile }
const SPLENDOR = splendorFile as unknown as CapturedFile
const UMBRA = umbraFile as unknown as CapturedFile
const JADE = jadeFile as unknown as CapturedFile

const SHARED_IDS = ["swordQ", "swordSpecial", "spearCharged"]
const SPLENDOR_IDS = ["namelessSwordQ", "namelessSwordSpecial", "namelessSpearCharged"]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function withAttunements(profile: StoredProfile, attunements: string[]): StoredProfile {
  const inventory = profile.inputs.inventory.map((piece, index) =>
    index < attunements.length ? { ...piece, attunement: attunements[index] } : piece,
  )
  return { ...profile, inputs: { ...profile.inputs, inventory } }
}

function blobOf(
  profile: StoredProfile,
  version = V35__splendorAttunementIds.to - 1,
): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

function attunementsOf(blob: RawProfilesBlob): string[] {
  return (blob.profiles[0] as StoredProfile).inputs.inventory.map((piece) => piece.attunement)
}

describe("the captured profiles are genuinely pre-change", () => {
  it("store v34, the version this step reads", () => {
    for (const file of [SPLENDOR, UMBRA, JADE]) {
      expect(file.v).toBe(V35__splendorAttunementIds.to - 1)
    }
  })

  it("hold no Splendor-only attunement id on any piece", () => {
    for (const file of [SPLENDOR, UMBRA, JADE]) {
      for (const piece of file.profile.inputs.inventory) {
        expect(SPLENDOR_IDS).not.toContain(piece.attunement)
      }
    }
  })
})

describe("V35__splendorAttunementIds — called directly", () => {
  beforeEach(() => localStorage.clear())

  it("renames the three shared ids on a Splendor profile and leaves everything else alone", () => {
    const before = withAttunements(clone(SPLENDOR.profile), SHARED_IDS)
    const migrated = V35__splendorAttunementIds.migrate(blobOf(before))
    expect(migrated.v).toBe(35)
    expect(attunementsOf(migrated).slice(0, 3)).toEqual(SPLENDOR_IDS)
    const expected = clone(before)
    expected.inputs.inventory.forEach((piece, index) => {
      if (index < 3) piece.attunement = SPLENDOR_IDS[index]
    })
    expect((migrated.profiles[0] as StoredProfile).inputs).toEqual(expected.inputs)
  })

  it("leaves an Umbra profile holding the same ids untouched", () => {
    const before = withAttunements(clone(UMBRA.profile), SHARED_IDS)
    const migrated = V35__splendorAttunementIds.migrate(blobOf(before))
    expect((migrated.profiles[0] as StoredProfile).inputs).toEqual(before.inputs)
  })

  it("leaves a Jade profile holding a shared id untouched", () => {
    const before = withAttunements(clone(JADE.profile), ["swordQ"])
    const migrated = V35__splendorAttunementIds.migrate(blobOf(before))
    expect(attunementsOf(migrated)[0]).toBe("swordQ")
  })

  it("leaves every other id on a Splendor profile alone, an unknown one included", () => {
    const others = ["swordCharged", "spearSpecial", "physPen", "unknownId"]
    const before = withAttunements(clone(SPLENDOR.profile), others)
    const migrated = V35__splendorAttunementIds.migrate(blobOf(before))
    expect(attunementsOf(migrated).slice(0, 4)).toEqual(others)
  })

  it("renames to ids Splendor offers, and only Splendor", () => {
    const offered = classDefinition("bellstrikeSplendor")!.classSpecificAttunements
    for (const id of Object.values(SPLENDOR_ATTUNEMENT_RENAMES)) {
      expect(getAttunement(id)).toBeDefined()
      expect(getAttunement(id)!.classIds).toEqual(["bellstrikeSplendor"])
      expect(offered).toContain(id)
    }
  })

  it("keeps the rolled value scoring for the profile's own class", () => {
    const before = withAttunements(clone(SPLENDOR.profile), [])
    const equippedHelm = before.inputs.equipped.helm
    const index = before.inputs.inventory.findIndex((piece) => piece.id === equippedHelm)
    expect(index).toBeGreaterThanOrEqual(0)
    const inventory = before.inputs.inventory.map((piece, position) =>
      position === index ? { ...piece, attunement: "swordQ", attunementValue: 0.05 } : piece,
    )
    localStorage.setItem(
      "wwm.profiles",
      JSON.stringify(blobOf({ ...before, inputs: { ...before.inputs, inventory } })),
    )
    const inputs = withDerivedStats(loadProfiles().profiles[0].inputs)
    expect(inputs.classSpecificAttunement.namelessSwordQ).toBeCloseTo(0.05, 9)
    expect(buildContext(inputs).attuneBoostByTag?.["attune:namelessSwordQ"]).toBeCloseTo(0.05, 9)
  })

  it("is idempotent and does not mutate its input", () => {
    const before = blobOf(withAttunements(clone(SPLENDOR.profile), SHARED_IDS))
    const snapshot = clone(before)
    const once = V35__splendorAttunementIds.migrate(before)
    expect(before).toEqual(snapshot)
    expect(V35__splendorAttunementIds.migrate(once)).toEqual({ ...once, v: 35 })
  })

  it("survives a profile with no inputs or no inventory", () => {
    const blob: RawProfilesBlob = {
      v: 34,
      profiles: [{ id: "a" }, { id: "b", inputs: { classId: "bellstrikeSplendor" } }, null],
      activeId: "a",
    }
    expect(V35__splendorAttunementIds.migrate(blob).profiles).toEqual(blob.profiles)
  })
})

describe("the rename helpers", () => {
  it("rename an id only for Splendor", () => {
    expect(migrateSplendorAttunementId("bellstrikeSplendor", "swordQ")).toBe("namelessSwordQ")
    expect(migrateSplendorAttunementId("bellstrikeUmbra", "swordQ")).toBe("swordQ")
    expect(migrateSplendorAttunementId(undefined, "swordQ")).toBe("swordQ")
    expect(migrateSplendorAttunementId("bellstrikeSplendor", "toString")).toBe("toString")
  })

  it("rename an attune tag only for Splendor and leave other tags alone", () => {
    expect(migrateSplendorAttuneTag("bellstrikeSplendor", "attune:spearCharged")).toBe(
      "attune:namelessSpearCharged",
    )
    expect(migrateSplendorAttuneTag("bellstrikeUmbra", "attune:spearCharged")).toBe(
      "attune:spearCharged",
    )
    expect(migrateSplendorAttuneTag("bellstrikeSplendor", "weapon:sword")).toBe("weapon:sword")
  })

  it("return the same inputs object when nothing changed", () => {
    const inputs = SPLENDOR.profile.inputs
    expect(splitSplendorAttunements(inputs)).toBe(inputs)
    expect(splitSplendorAttunements(null)).toBeNull()
  })
})

describe("V35__splendorAttunementIds — registered", () => {
  it("is the only step a v34 blob walks through", () => {
    const result = runProfileMigrations(
      blobOf(withAttunements(clone(SPLENDOR.profile), SHARED_IDS)),
      { toVersion: V35__splendorAttunementIds.to },
    )!
    expect(result.applied).toEqual(["V35__splendorAttunementIds"])
    expect(result.blob.v).toBe(35)
    expect(attunementsOf(result.blob).slice(0, 3)).toEqual(SPLENDOR_IDS)
  })
})
