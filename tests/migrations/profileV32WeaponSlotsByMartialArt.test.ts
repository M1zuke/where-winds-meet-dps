import { describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V32__weaponSlotsByMartialArt,
  moveCustomBuildWeaponsToMartialArtSlots,
  moveWeaponsToMartialArtSlots,
} from "../../src/migrations/V32__weaponSlotsByMartialArt"
import type { StoredProfile } from "../../src/engine/types"
import umbraFile from "./testProfiles/v31/bellstrikeUmbra.json"
import bamboocutFile from "./testProfiles/v31/bamboocutDraught.json"

type CapturedFile = { v: number; profile: StoredProfile }
const UMBRA = umbraFile as unknown as CapturedFile
const BAMBOOCUT = bamboocutFile as unknown as CapturedFile

type RawPiece = { id: string; slot: string; words: { word: string }[] }
type RawInputs = {
  classId: string
  inventory: RawPiece[]
  equipped: Record<string, string | null>
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function rawInputsOf(profile: StoredProfile): RawInputs {
  return profile.inputs as unknown as RawInputs
}

function blobOf(profile: StoredProfile, version: number): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

function migratedInputs(profile: StoredProfile): RawInputs {
  const result = runProfileMigrations(blobOf(profile, 31), {
    toVersion: V32__weaponSlotsByMartialArt.to,
  })!
  return rawInputsOf(result.blob.profiles[0] as StoredProfile)
}

function pieceById(inputs: RawInputs, id: string): RawPiece {
  return inputs.inventory.find((piece) => piece.id === id)!
}

function withWeaponsSwapped(profile: StoredProfile): StoredProfile {
  const swapped = clone(profile)
  const inputs = rawInputsOf(swapped)
  const leftId = inputs.equipped.leftWeapon!
  const rightId = inputs.equipped.rightWeapon!
  pieceById(inputs, leftId).slot = "rightWeapon"
  pieceById(inputs, rightId).slot = "leftWeapon"
  inputs.equipped.leftWeapon = rightId
  inputs.equipped.rightWeapon = leftId
  return swapped
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v31, the version this step reads", () => {
    expect(UMBRA.v).toBe(V32__weaponSlotsByMartialArt.to - 1)
    expect(BAMBOOCUT.v).toBe(V32__weaponSlotsByMartialArt.to - 1)
  })

  it("holds each art's boost on the slot a class lists that art for", () => {
    const umbra = rawInputsOf(UMBRA.profile)
    const bamboocut = rawInputsOf(BAMBOOCUT.profile)
    const wordsOn = (inputs: RawInputs, slot: string) =>
      pieceById(inputs, inputs.equipped[slot]!).words.map((entry) => entry.word)
    expect(wordsOn(umbra, "leftWeapon")).toContain("swordBoost")
    expect(wordsOn(bamboocut, "leftWeapon")).toContain("gauntletsBoost")
    expect(wordsOn(bamboocut, "rightWeapon")).toContain("dualKnivesBoost")
  })
})

describe("V32__weaponSlotsByMartialArt", () => {
  it("is the only step a v31 blob walks through", () => {
    const result = runProfileMigrations(blobOf(clone(UMBRA.profile), 31), { toVersion: 32 })!
    expect(result.applied).toEqual(["V32__weaponSlotsByMartialArt"])
    expect(result.blob.v).toBe(32)
  })

  it("leaves a profile already in its art's slots exactly as it was", () => {
    const profile = clone(BAMBOOCUT.profile)
    expect(migratedInputs(profile)).toEqual(rawInputsOf(profile))
  })

  it("moves two swapped equipped weapons back to their art's slots", () => {
    const original = rawInputsOf(BAMBOOCUT.profile)
    const inputs = migratedInputs(withWeaponsSwapped(BAMBOOCUT.profile))

    expect(inputs.equipped.leftWeapon).toBe(original.equipped.leftWeapon)
    expect(inputs.equipped.rightWeapon).toBe(original.equipped.rightWeapon)
    expect(pieceById(inputs, inputs.equipped.leftWeapon!).slot).toBe("leftWeapon")
    expect(pieceById(inputs, inputs.equipped.rightWeapon!).slot).toBe("rightWeapon")
    expect(inputs.inventory).toEqual(original.inventory)
  })

  it("moves an unequipped weapon holding the other slot's boost", () => {
    const profile = clone(UMBRA.profile)
    const inputs = rawInputsOf(profile)
    const spare: RawPiece = {
      ...clone(pieceById(inputs, inputs.equipped.rightWeapon!)),
      id: "spare-spear",
      words: [{ word: "maxPhys" }, { word: "spearBoost" }, { word: "power" }],
      slot: "leftWeapon",
    }
    inputs.inventory.push(spare)

    const migrated = migratedInputs(profile)
    expect(pieceById(migrated, "spare-spear").slot).toBe("rightWeapon")
    expect(migrated.equipped).toEqual(inputs.equipped)
  })

  it("leaves an unequipped weapon without a boost where it is", () => {
    const profile = clone(UMBRA.profile)
    const inputs = rawInputsOf(profile)
    inputs.inventory.push({
      ...clone(pieceById(inputs, inputs.equipped.rightWeapon!)),
      id: "spare-plain",
      words: [{ word: "maxPhys" }, { word: "power" }],
      slot: "leftWeapon",
    })

    expect(pieceById(migratedInputs(profile), "spare-plain").slot).toBe("leftWeapon")
  })

  it("moves neither equipped weapon when both would end on the same slot", () => {
    const profile = clone(UMBRA.profile)
    const inputs = rawInputsOf(profile)
    pieceById(inputs, inputs.equipped.leftWeapon!).slot = "rightWeapon"
    pieceById(inputs, inputs.equipped.rightWeapon!).slot = "rightWeapon"

    expect(migratedInputs(profile)).toEqual(inputs)
  })

  it("keeps the equipped pair when one of them already holds its own slot's boost", () => {
    const profile = clone(BAMBOOCUT.profile)
    const inputs = rawInputsOf(profile)
    pieceById(inputs, inputs.equipped.rightWeapon!).words.push({ word: "gauntletsBoost" })
    pieceById(inputs, inputs.equipped.rightWeapon!).words = pieceById(
      inputs,
      inputs.equipped.rightWeapon!,
    ).words.filter((entry) => entry.word !== "dualKnivesBoost")

    expect(migratedInputs(profile)).toEqual(inputs)
  })

  it("never touches a class outside its table", () => {
    const profile = withWeaponsSwapped(UMBRA.profile)
    rawInputsOf(profile).classId = "unknownClass"
    expect(migratedInputs(profile)).toEqual(rawInputsOf(profile))
  })

  it("leaves the user's build otherwise untouched", () => {
    const before = rawInputsOf(UMBRA.profile)
    const after = migratedInputs(withWeaponsSwapped(UMBRA.profile))
    const { inventory: _beforeInventory, equipped: _beforeEquipped, ...beforeRest } = before
    const { inventory: _afterInventory, equipped: _afterEquipped, ...afterRest } = after
    void [_beforeInventory, _beforeEquipped, _afterInventory, _afterEquipped]
    expect(afterRest).toEqual(beforeRest)
    expect(after.inventory.length).toBe(before.inventory.length)
  })

  it("is idempotent and does not mutate its input", () => {
    const swapped = withWeaponsSwapped(UMBRA.profile)
    const input = rawInputsOf(swapped) as unknown as Record<string, unknown>
    const snapshot = clone(input)
    const once = moveWeaponsToMartialArtSlots(input)
    expect(input).toEqual(snapshot)
    expect(moveWeaponsToMartialArtSlots(once)).toEqual(once)
    expect(
      runProfileMigrations(blobOf(clone(UMBRA.profile), 32), { toVersion: 32 })!.applied,
    ).toEqual([])
  })
})

describe("a custom graduation build", () => {
  const slot = (name: string, words: string[]) => ({ slot: name, words, attunement: "physPen" })

  it("moves swapped weapon entries back to their art's slots", () => {
    const healed = moveCustomBuildWeaponsToMartialArtSlots("bamboocutDraught", [
      slot("leftWeapon", ["a", "dualKnivesBoost"]),
      slot("rightWeapon", ["gauntletsBoost", "b"]),
      slot("disc", ["allMartialBoost"]),
    ]) as { slot: string; words: string[] }[]

    expect(healed.map((entry) => entry.slot)).toEqual(["rightWeapon", "leftWeapon", "disc"])
    expect(healed[0].words).toEqual(["a", "dualKnivesBoost"])
  })

  it("keeps both entries when one already sits on its own art's slot", () => {
    const entries = [
      slot("leftWeapon", ["gauntletsBoost"]),
      slot("rightWeapon", ["gauntletsBoost"]),
    ]
    expect(moveCustomBuildWeaponsToMartialArtSlots("bamboocutDraught", entries)).toEqual(entries)
  })

  it("is idempotent", () => {
    const healed = moveCustomBuildWeaponsToMartialArtSlots("bamboocutDraught", [
      slot("leftWeapon", ["dualKnivesBoost"]),
      slot("rightWeapon", ["gauntletsBoost"]),
    ])
    expect(moveCustomBuildWeaponsToMartialArtSlots("bamboocutDraught", healed)).toEqual(healed)
  })
})
