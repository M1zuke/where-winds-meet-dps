import { describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V33__allMysticBoostFromGearLevel100,
  mergeMysticBoostWords,
} from "../../src/migrations/V33__allMysticBoostFromGearLevel100"
import type { StoredProfile } from "../../src/engine/types"
import umbraFile from "./testProfiles/v32/bellstrikeUmbra.json"

type CapturedFile = { v: number; profile: StoredProfile }
const UMBRA = umbraFile as unknown as CapturedFile

type RawWord = { word: string; value: number; retuned?: boolean }
type RawPiece = { id: string; slot: string; level: number; words: RawWord[] }
type RawInputs = { inventory: RawPiece[]; equipped: Record<string, string | null> }

const LEGACY_MYSTIC_WORDS = ["singleTargetMysticBoost", "areaMysticBoost"]

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
  const result = runProfileMigrations(blobOf(profile, 32), {
    toVersion: V33__allMysticBoostFromGearLevel100.to,
  })!
  return rawInputsOf(result.blob.profiles[0] as StoredProfile)
}

function equippedPiece(inputs: RawInputs, slot: string): RawPiece {
  return inputs.inventory.find((piece) => piece.id === inputs.equipped[slot])!
}

function withHelmAndArmorAtLevel(profile: StoredProfile, level: number): StoredProfile {
  const raised = clone(profile)
  const inputs = rawInputsOf(raised)
  equippedPiece(inputs, "helm").level = level
  equippedPiece(inputs, "armor").level = level
  return raised
}

function mysticWordsOf(piece: RawPiece): RawWord[] {
  return piece.words.filter((entry) => entry.word.endsWith("MysticBoost"))
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v32, the version this step reads", () => {
    expect(UMBRA.v).toBe(V33__allMysticBoostFromGearLevel100.to - 1)
  })

  it("holds a legacy mystic word on its level-96 helm and chestpiece", () => {
    const inputs = rawInputsOf(UMBRA.profile)
    for (const slot of ["helm", "armor"]) {
      const piece = equippedPiece(inputs, slot)
      expect(piece.level).toBe(96)
      expect(mysticWordsOf(piece).map((entry) => entry.word)).toEqual(["singleTargetMysticBoost"])
    }
  })
})

describe("V33__allMysticBoostFromGearLevel100", () => {
  it("is the only step a v32 blob walks through", () => {
    const result = runProfileMigrations(blobOf(clone(UMBRA.profile), 32), { toVersion: 33 })!
    expect(result.applied).toEqual(["V33__allMysticBoostFromGearLevel100"])
    expect(result.blob.v).toBe(33)
  })

  it("leaves a profile whose gear sits below level 100 exactly as it was", () => {
    const profile = clone(UMBRA.profile)
    expect(migratedInputs(profile)).toEqual(rawInputsOf(profile))
  })

  it.each([100, 105])(
    "turns a level-%i piece's legacy word into the merged one, roll kept",
    (level) => {
      const profile = withHelmAndArmorAtLevel(UMBRA.profile, level)
      const before = rawInputsOf(profile)
      const after = migratedInputs(profile)
      for (const slot of ["helm", "armor"]) {
        const original = mysticWordsOf(equippedPiece(before, slot))
        const merged = mysticWordsOf(equippedPiece(after, slot))
        expect(merged).toEqual(original.map((entry) => ({ ...entry, word: "allMysticBoost" })))
      }
    },
  )

  it("turns the area word as well as the single-target one", () => {
    const profile = withHelmAndArmorAtLevel(UMBRA.profile, 100)
    const helm = equippedPiece(rawInputsOf(profile), "helm")
    const line = helm.words.findIndex((entry) => entry.word === "singleTargetMysticBoost")
    helm.words[line] = { ...helm.words[line], word: "areaMysticBoost" }

    const merged = equippedPiece(migratedInputs(profile), "helm").words[line]
    expect(merged.word).toBe("allMysticBoost")
    expect(merged.value).toBe(helm.words[line].value)
  })

  it("touches no word but the two legacy mystic ones", () => {
    const profile = withHelmAndArmorAtLevel(UMBRA.profile, 100)
    const before = rawInputsOf(profile)
    const after = migratedInputs(profile)
    after.inventory.forEach((piece, index) => {
      piece.words.forEach((entry, line) => {
        const original = before.inventory[index].words[line]
        if (LEGACY_MYSTIC_WORDS.includes(original.word)) return
        expect(entry).toEqual(original)
      })
    })
  })

  it("leaves the user's build otherwise untouched", () => {
    const profile = withHelmAndArmorAtLevel(UMBRA.profile, 100)
    const before = rawInputsOf(profile)
    const after = migratedInputs(profile)
    const { inventory: _beforeInventory, ...beforeRest } = before
    const { inventory: _afterInventory, ...afterRest } = after
    void [_beforeInventory, _afterInventory]
    expect(afterRest).toEqual(beforeRest)
    expect(after.inventory.map(({ words: _words, ...piece }) => piece)).toEqual(
      before.inventory.map(({ words: _words, ...piece }) => piece),
    )
  })

  it("is idempotent and does not mutate its input", () => {
    const profile = withHelmAndArmorAtLevel(UMBRA.profile, 100)
    const input = rawInputsOf(profile) as unknown as Record<string, unknown>
    const snapshot = clone(input)
    const once = mergeMysticBoostWords(input)
    expect(input).toEqual(snapshot)
    expect(mergeMysticBoostWords(once)).toEqual(once)
    expect(
      runProfileMigrations(blobOf(clone(UMBRA.profile), 33), { toVersion: 33 })!.applied,
    ).toEqual([])
  })
})
