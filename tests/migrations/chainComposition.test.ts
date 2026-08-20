import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import { loadProfiles } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import {
  LATEST_PROFILES_VERSION,
  runProfileMigrations,
  type RawProfilesBlob,
} from "../../src/migrations"
import type { Inputs, StoredProfile } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"
const ROOT = join(process.cwd(), "tests/migrations/testProfiles")

type Fixture = { version: number; classId: string; profile: StoredProfile }

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function allFixtures(): Fixture[] {
  return readdirSync(ROOT)
    .filter((entry) => statSync(join(ROOT, entry)).isDirectory())
    .flatMap((folder) => {
      const version = Number(folder.slice(1))
      return readdirSync(join(ROOT, folder))
        .filter((file) => file.endsWith(".json"))
        .map((file) => {
          const stored = JSON.parse(readFileSync(join(ROOT, folder, file), "utf8")) as {
            v: number
            profile: StoredProfile
          }
          return { version, classId: file.replace(/\.json$/, ""), profile: stored.profile }
        })
    })
    .sort(
      (left, right) => left.version - right.version || left.classId.localeCompare(right.classId),
    )
}

const FIXTURES = allFixtures()

const OLDEST_PER_CLASS = [
  ...new Map(
    [...FIXTURES].reverse().map((fixture): [string, Fixture] => [fixture.classId, fixture]),
  ).values(),
].sort((left, right) => left.classId.localeCompare(right.classId))

function blobOf(fixture: Fixture): RawProfilesBlob {
  const profile = clone(fixture.profile)
  return { v: fixture.version, profiles: [profile], activeId: profile.id }
}

function inputsOf(blob: RawProfilesBlob): Inputs {
  return (blob.profiles[0] as StoredProfile).inputs
}

function wordValues(inputs: Inputs): number[] {
  return inputs.inventory.flatMap((piece) =>
    piece.words.filter((entry) => entry.word).map((entry) => entry.value),
  )
}

const cases = (list: Fixture[]): [string, Fixture][] =>
  list.map((fixture) => [`v${fixture.version}/${fixture.classId}`, fixture])

describe("every captured fixture walks the whole chain", () => {
  it.each(cases(FIXTURES))(
    "%s lands at the latest version on the class it is filed under",
    (_name, fixture) => {
      const result = runProfileMigrations(blobOf(fixture))!
      expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
      expect(result.blob.profiles).toHaveLength(1)
      expect(inputsOf(result.blob).classId).toBe(fixture.classId)
    },
  )

  it.each(cases(FIXTURES))(
    "%s keeps its identity, gear inventory and word roll values across every hop",
    (_name, fixture) => {
      const result = runProfileMigrations(blobOf(fixture))!
      const walked = result.blob.profiles[0] as StoredProfile
      expect(walked.id).toBe(fixture.profile.id)
      expect(walked.name).toBe(fixture.profile.name)
      expect(walked.inputs.inventory).toHaveLength(fixture.profile.inputs.inventory.length)
      expect(walked.inputs.equipped).toEqual(fixture.profile.inputs.equipped)
      expect(wordValues(walked.inputs)).toEqual(wordValues(fixture.profile.inputs))
    },
  )
})

describe("the oldest fixture per class survives loadProfiles end to end", () => {
  beforeEach(() => localStorage.clear())

  it.each(cases(OLDEST_PER_CLASS))(
    "%s is persisted once at the latest version with the build intact",
    (_name, fixture) => {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(fixture)))
      const { profiles } = loadProfiles()
      expect(profiles).toHaveLength(1)
      expect(profiles[0].id).toBe(fixture.profile.id)
      expect(profiles[0].name).toBe(fixture.profile.name)
      expect(profiles[0].inputs.classId).toBe(fixture.classId)
      expect(profiles[0].inputs.inventory).toHaveLength(fixture.profile.inputs.inventory.length)

      const persisted = JSON.parse(localStorage.getItem(PROFILES_KEY)!) as RawProfilesBlob
      expect(persisted.v).toBe(LATEST_PROFILES_VERSION)
    },
  )

  it.each(cases(OLDEST_PER_CLASS))(
    "%s still computes positive DPS with no missing-rotation warning",
    (_name, fixture) => {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(fixture)))
      const loaded = loadProfiles().profiles[0].inputs
      const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(loaded))))
      expect(result.dps).toBeGreaterThan(0)
      expect(result.warnings.some((warning) => /no default rotation/i.test(warning))).toBe(false)
    },
  )

  it.each(cases(OLDEST_PER_CLASS))(
    "%s loads the same on a second load — the walk ran once",
    (_name, fixture) => {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(fixture)))
      const once = loadProfiles()
      expect(loadProfiles()).toEqual(once)
    },
  )
})
