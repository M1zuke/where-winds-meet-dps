// The Single-Target Mystic Skill DMG Boost max roll dropped from 11 % to
// 9.797 %, so a profile saved under the old cap can hold a word value the new
// cap forbids. `hydrateInputs` never validated word values against their cap, so
// only the V7 step can heal this — deleting it from PROFILE_MIGRATIONS must fail
// the clamp tests below.
import { beforeEach, describe, expect, it } from "vitest"
import { loadProfiles } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { computeGearContribution, relayedCapValue } from "../../src/engine/gearStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import {
  LATEST_PROFILES_VERSION,
  runProfileMigrations,
  type RawProfilesBlob,
} from "../../src/migrations"
import { V7__clampSingleMysticWordRoll } from "../../src/migrations/V7__clampSingleMysticWordRoll"
import type { GearPiece, Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v6/bellstrikeUmbra.json"

const PROFILES_KEY = "wwm.profiles"
const WORD = "Single-Target Mystic Skill DMG Boost"
const MAX_ROLL = 0.09797

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile, version = LEGACY.v): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

function writeProfilesBlob(profile: StoredProfile): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(profile)))
}

function loadOne(): StoredProfile {
  const { profiles } = loadProfiles()
  expect(profiles).toHaveLength(1)
  return profiles[0]
}

const inputsOf = (blob: RawProfilesBlob) =>
  (blob.profiles[0] as unknown as { inputs: Inputs }).inputs

function mysticWordValues(inputs: Inputs): number[] {
  return inputs.inventory.flatMap((piece) =>
    piece.words.filter((entry) => entry.word === WORD).map((entry) => entry.value),
  )
}

const PIECE_WITH_MYSTIC_WORD = 8

function withMysticWordAt(profile: StoredProfile, value: number, relayed: boolean): StoredProfile {
  const next = clone(profile)
  const piece = next.inputs.inventory[PIECE_WITH_MYSTIC_WORD]
  piece.relayed = relayed
  piece.words = piece.words.map((entry) =>
    entry.word === WORD ? { ...entry, value } : entry,
  ) as GearPiece["words"]
  return next
}

function pipelineDps(inputs: Inputs): ReturnType<typeof runEngine> {
  return runEngine(applyBowSet(applyArmorSet(withDerivedStats(inputs))))
}

describe("profile-v6 fixture — the stored blob predates the corrected max roll", () => {
  it("is version 6 and carries the word at a value the old cap allowed", () => {
    expect(LEGACY.v).toBe(6)
    const piece = LEGACY.profile.inputs.inventory[PIECE_WITH_MYSTIC_WORD]
    expect(piece.words.some((entry) => entry.word === WORD)).toBe(true)
    expect(mysticWordValues(LEGACY.profile.inputs)).toEqual([0.078])
  })
})

describe("the corrected cap is what the gear form and the engine both use", () => {
  it("getWordSpecs reports 9.797 %, and relayed gear 9.21 %", () => {
    const spec = getWordSpecs(LEGACY.profile.inputs).find((candidate) => candidate.word === WORD)!
    expect(spec.amount).toBeCloseTo(MAX_ROLL, 10)
    expect(relayedCapValue(spec.amount, spec.unit)).toBeCloseTo(0.0921, 10)
  })

  it("only ever raises the cap a stored roll was clamped to, so v7 profiles stay legal", () => {
    const spec = getWordSpecs(LEGACY.profile.inputs).find((candidate) => candidate.word === WORD)!
    expect(relayedCapValue(spec.amount, spec.unit)).toBeGreaterThanOrEqual(0.092)
  })
})

describe("V7 step — v6 → v7 in isolation", () => {
  it("clamps an over-cap value down to the corrected max roll", () => {
    const migrated = V7__clampSingleMysticWordRoll.migrate(
      blobOf(withMysticWordAt(LEGACY.profile, 0.11, false)),
    )
    expect(migrated.v).toBe(V7__clampSingleMysticWordRoll.to)
    expect(mysticWordValues(inputsOf(migrated))).toEqual([MAX_ROLL])
  })

  it("clamps a relayed piece to the relayed cap instead", () => {
    const migrated = V7__clampSingleMysticWordRoll.migrate(
      blobOf(withMysticWordAt(LEGACY.profile, 0.1034, true)),
    )
    expect(mysticWordValues(inputsOf(migrated))).toEqual([0.092])
  })

  it("leaves a value already under the cap alone", () => {
    const migrated = V7__clampSingleMysticWordRoll.migrate(blobOf(clone(LEGACY.profile)))
    expect(mysticWordValues(inputsOf(migrated))).toEqual([0.078])
  })

  it("carries every neighbouring field across the step untouched", () => {
    const migrated = V7__clampSingleMysticWordRoll.migrate(
      blobOf(withMysticWordAt(LEGACY.profile, 0.11, false)),
    )
    const before = LEGACY.profile.inputs
    const after = inputsOf(migrated)
    expect(after.inventory).toHaveLength(before.inventory.length)
    expect(after.equipped).toEqual(before.equipped)
    expect(after.mindMethods).toEqual(before.mindMethods)
    expect(after.oddities).toEqual(before.oddities)
    expect(after.martialArtsTalents).toEqual(before.martialArtsTalents)
    expect(after.phys).toEqual(before.phys)
    expect(after.critRate).toBe(before.critRate)
    expect(after.affinityRate).toBe(before.affinityRate)
    expect(after.arsenal).toBe(before.arsenal)
    expect(after.breakthrough).toBe(before.breakthrough)
    expect(after.activeCustomRotation).toEqual(before.activeCustomRotation)

    const untouchedPieces = after.inventory.filter(
      (_piece, index) => index !== PIECE_WITH_MYSTIC_WORD,
    )
    expect(untouchedPieces).toEqual(
      before.inventory.filter((_piece, index) => index !== PIECE_WITH_MYSTIC_WORD),
    )
    const clamped = after.inventory[PIECE_WITH_MYSTIC_WORD]
    const original = before.inventory[PIECE_WITH_MYSTIC_WORD]
    expect(clamped.words.filter((entry) => entry.word !== WORD)).toEqual(
      original.words.filter((entry) => entry.word !== WORD),
    )

    const migratedProfile = migrated.profiles[0] as StoredProfile
    expect(migratedProfile.id).toBe(LEGACY.profile.id)
    expect(migratedProfile.name).toBe(LEGACY.profile.name)
  })

  it("is registered, and the chain reports it for a v6 blob", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)))!
    expect(result.applied).toContain("V7__clampSingleMysticWordRoll")
    expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
  })

  it("does not mutate its input, and migrating twice equals migrating once", () => {
    const input = blobOf(withMysticWordAt(LEGACY.profile, 0.11, false))
    const snapshot = clone(input)
    const once = V7__clampSingleMysticWordRoll.migrate(input)
    expect(input).toEqual(snapshot)
    const twice = V7__clampSingleMysticWordRoll.migrate(once)
    expect(twice).toEqual(once)
  })
})

describe("v6 profile with an over-cap roll → loaded build", () => {
  beforeEach(() => localStorage.clear())

  it("arrives clamped, so the word can no longer over-contribute", () => {
    writeProfilesBlob(withMysticWordAt(LEGACY.profile, 0.11, false))
    const after = loadOne()
    expect(mysticWordValues(after.inputs)).toEqual([MAX_ROLL])

    const piece = after.inputs.inventory[PIECE_WITH_MYSTIC_WORD]
    const entry = computeGearContribution(piece, after.inputs).find(
      (contribution) => contribution.path === "singleMysticBoost",
    )
    expect(entry?.amount).toBeCloseTo(MAX_ROLL, 10)
  })

  it("re-persists the blob at the latest version so the walk runs once", () => {
    writeProfilesBlob(withMysticWordAt(LEGACY.profile, 0.11, false))
    loadProfiles()
    const persisted = JSON.parse(localStorage.getItem(PROFILES_KEY)!)
    expect(persisted.v).toBe(LATEST_PROFILES_VERSION)
    expect(persisted.profiles[0].inputs.inventory[PIECE_WITH_MYSTIC_WORD].words).toEqual(
      expect.arrayContaining([{ word: WORD, value: MAX_ROLL, retuned: false }]),
    )
  })

  it("keeps the rest of the user's build and still computes positive DPS", () => {
    writeProfilesBlob(withMysticWordAt(LEGACY.profile, 0.11, false))
    const after = loadOne()
    expect(after.id).toBe(LEGACY.profile.id)
    expect(after.name).toBe(LEGACY.profile.name)
    expect(after.inputs.inventory).toHaveLength(LEGACY.profile.inputs.inventory.length)
    expect(after.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)
    expect(after.inputs.mindMethods.map((slot) => slot.name)).toEqual(
      LEGACY.profile.inputs.mindMethods.map((slot) => slot.name),
    )

    const result = pipelineDps(after.inputs)
    expect(result.dps).toBeGreaterThan(0)
    expect(result.warnings.some((warning) => /no default rotation/i.test(warning))).toBe(false)
  })

  it("is idempotent — loading twice in a row yields an equal profile", () => {
    writeProfilesBlob(withMysticWordAt(LEGACY.profile, 0.11, false))
    const once = loadOne()
    writeProfilesBlob(clone(once))
    expect(loadOne()).toEqual(once)
  })
})

describe("v6 profile at its captured values", () => {
  beforeEach(() => localStorage.clear())

  it("loads with the word value byte-identical — nothing legal is touched", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    const after = loadOne()
    expect(mysticWordValues(after.inputs)).toEqual([0.078])
    expect(after.inputs.inventory[PIECE_WITH_MYSTIC_WORD].words).toEqual(
      LEGACY.profile.inputs.inventory[PIECE_WITH_MYSTIC_WORD].words,
    )
  })
})
