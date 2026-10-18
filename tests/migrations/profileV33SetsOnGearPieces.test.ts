import { describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V33__setsOnGearPieces,
  moveSetsOntoGearPieces,
} from "../../src/migrations/V33__setsOnGearPieces"
import { carriedSets, type Inputs, type StoredProfile } from "./legacyProfile"
import umbraFile from "./testProfiles/v32/bellstrikeUmbra.json"
import bamboocutFile from "./testProfiles/v32/bamboocutDraught.json"

type CapturedFile = { v: number; profile: StoredProfile }
const UMBRA = umbraFile as unknown as CapturedFile
const BAMBOOCUT = bamboocutFile as unknown as CapturedFile

const SET_BEARING_SLOTS = ["leftWeapon", "rightWeapon", "disc", "pendant"] as const

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile, version: number): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

function migratedInputs(profile: StoredProfile): Inputs {
  const result = runProfileMigrations(blobOf(profile, 32), {
    toVersion: V33__setsOnGearPieces.to,
  })!
  return (result.blob.profiles[0] as StoredProfile).inputs
}

function pieceInSlot(inputs: Inputs, slot: string) {
  const id = (inputs.equipped as Record<string, string | null>)[slot]
  return inputs.inventory.find((piece) => piece.id === id)!
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v32, the version this step reads", () => {
    expect(UMBRA.v).toBe(V33__setsOnGearPieces.to - 1)
    expect(BAMBOOCUT.v).toBe(V33__setsOnGearPieces.to - 1)
  })

  it("holds the set and bow set on the build, and no set on any piece", () => {
    expect(UMBRA.profile.inputs.set).toBe("hawkwing")
    expect(UMBRA.profile.inputs.bowSet).toBe("affinity")
    expect(UMBRA.profile.inputs.inventory.some((piece) => "set" in piece)).toBe(false)
    expect("bowGear" in UMBRA.profile.inputs).toBe(false)
  })
})

describe("V33__setsOnGearPieces", () => {
  it("is the only step a v32 blob walks through", () => {
    const result = runProfileMigrations(blobOf(clone(UMBRA.profile), 32), { toVersion: 33 })!
    expect(result.applied).toEqual(["V33__setsOnGearPieces"])
    expect(result.blob.v).toBe(33)
  })

  it("writes the build's set onto every piece equipped in a set-bearing slot", () => {
    const inputs = migratedInputs(clone(UMBRA.profile))
    for (const slot of SET_BEARING_SLOTS) expect(pieceInSlot(inputs, slot).set).toBe("hawkwing")
    expect(carriedSets(inputs)).toEqual(["hawkwing", "hawkwing", "hawkwing", "hawkwing"])
  })

  it("leaves unequipped pieces and armor-slot pieces without a set", () => {
    const inputs = migratedInputs(clone(UMBRA.profile))
    const equippedIds = new Set(SET_BEARING_SLOTS.map((slot) => pieceInSlot(inputs, slot).id))
    for (const piece of inputs.inventory) {
      if (!equippedIds.has(piece.id)) expect("set" in piece).toBe(false)
    }
  })

  it("keeps a set a piece already carries", () => {
    const profile = clone(UMBRA.profile)
    pieceInSlot(profile.inputs, "leftWeapon").set = "jadeware"
    const inputs = migratedInputs(profile)
    expect(pieceInSlot(inputs, "leftWeapon").set).toBe("jadeware")
    expect(pieceInSlot(inputs, "rightWeapon").set).toBe("hawkwing")
  })

  it("turns the bow set into a Bow and Thumb Ring pair at the breakthrough's gear level", () => {
    const profile = clone(UMBRA.profile)
    const inputs = migratedInputs(profile)
    expect(profile.inputs.breakthrough).toBe(16)
    const bowPiece = { level: 96, rarity: "legendary", set: "affinity" }
    expect(inputs.bowGear).toEqual({ bow: bowPiece, thumbRing: bowPiece })
  })

  it("creates no bow pieces below gear level 91", () => {
    const profile = clone(UMBRA.profile)
    profile.inputs.breakthrough = 13
    const inputs = migratedInputs(profile)
    expect(inputs.bowGear).toEqual({ bow: null, thumbRing: null })
    expect("bowSet" in inputs).toBe(false)
  })

  it.each([
    [14, 91],
    [15, 91],
    [16, 96],
    [17, 96],
    [18, 100],
    [19, 100],
    [20, 105],
    [21, 105],
  ])("maps breakthrough %i to bow level %i", (breakthrough, level) => {
    const profile = clone(UMBRA.profile)
    profile.inputs.breakthrough = breakthrough
    expect(migratedInputs(profile).bowGear.bow?.level).toBe(level)
  })

  it("leaves both bow pieces empty when no bow set was chosen", () => {
    const profile = clone(UMBRA.profile)
    profile.inputs.bowSet = null
    expect(migratedInputs(profile).bowGear).toEqual({ bow: null, thumbRing: null })
  })

  it("removes the build-level set and bow set", () => {
    const inputs = migratedInputs(clone(UMBRA.profile))
    expect("set" in inputs).toBe(false)
    expect("bowSet" in inputs).toBe(false)
  })

  it("only removes an armor-group set, writing it onto no piece", () => {
    const profile = clone(UMBRA.profile)
    profile.inputs.set = "calmwaters"
    const inputs = migratedInputs(profile)
    expect("set" in inputs).toBe(false)
    expect(carriedSets(inputs).filter(Boolean)).toEqual([])
  })

  it("keeps a set this build does not recognise exactly as stored", () => {
    const profile = clone(UMBRA.profile)
    profile.inputs.set = "setFromALaterBuild"
    expect(carriedSets(migratedInputs(profile))).toContain("setFromALaterBuild")
  })

  it("leaves the user's build otherwise untouched", () => {
    const before = UMBRA.profile.inputs
    const after = migratedInputs(clone(UMBRA.profile))
    const { set: _set, bowSet: _bowSet, inventory: _beforeInventory, ...beforeRest } = before
    const { bowGear: _bowGear, inventory: _afterInventory, ...afterRest } = after
    void [_set, _bowSet, _beforeInventory, _bowGear, _afterInventory]
    expect(afterRest).toEqual(beforeRest)
    expect(after.inventory).toHaveLength(before.inventory.length)
    expect(after.equipped).toEqual(before.equipped)
  })

  it("migrates a profile of another class the same way", () => {
    const inputs = migratedInputs(clone(BAMBOOCUT.profile))
    expect(carriedSets(inputs)).toEqual(["tiltrim", "tiltrim", "tiltrim", "tiltrim"])
    expect(inputs.bowGear.bow?.set).toBe("crit")
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(UMBRA.profile.inputs) as unknown as Record<string, unknown>
    const snapshot = clone(input)
    const once = moveSetsOntoGearPieces(input)
    expect(input).toEqual(snapshot)
    expect(moveSetsOntoGearPieces(once)).toEqual(once)
    expect(
      runProfileMigrations(blobOf(clone(UMBRA.profile), 33), { toVersion: 33 })!.applied,
    ).toEqual([])
  })
})
