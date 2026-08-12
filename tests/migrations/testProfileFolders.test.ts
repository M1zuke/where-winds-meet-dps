// The layout rule for `testProfiles/`, enforced rather than described: one
// folder per stored version, one file per class inside it, named for the class
// the profile resolves to. Adding a migration step is what makes a new folder
// mandatory — without this a step could ship with no captured profile at the
// version it reads, and nothing would say so.
//
// A folder holds a real capture where one exists and a forward walk of the
// nearest earlier profile otherwise; both are legitimate, and the rules below
// hold either way.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { LATEST_PROFILES_VERSION, PROFILE_MIGRATIONS, migrateClassId } from "../../src/migrations"
import { CLASS_IDS } from "../../src/definitions/classes/registry"

const ROOT = join(process.cwd(), "tests/migrations/testProfiles")

const versionsOnDisk = (): number[] =>
  readdirSync(ROOT)
    .filter((entry) => statSync(join(ROOT, entry)).isDirectory())
    .map((entry) => Number(entry.slice(1)))
    .sort((left, right) => left - right)

const profilesIn = (version: number) =>
  readdirSync(join(ROOT, `v${version}`)).filter((entry) => entry.endsWith(".json"))

const read = (version: number, file: string) =>
  JSON.parse(readFileSync(join(ROOT, `v${version}`, file), "utf8")) as {
    v: number
    profile: { inputs: { classId: string } }
  }

// The version a class's profiles start at — it cannot appear earlier, because a
// migration only walks forward.
function firstVersionOf(classId: string): number | null {
  for (const version of versionsOnDisk()) {
    if (profilesIn(version).includes(`${classId}.json`)) return version
  }
  return null
}

describe("testProfiles layout", () => {
  it("holds nothing but version folders — no loose profiles at the root", () => {
    const stray = readdirSync(ROOT).filter((entry) => !statSync(join(ROOT, entry)).isDirectory())
    expect(stray).toEqual([])
  })

  it("names every folder v<version>", () => {
    for (const entry of readdirSync(ROOT)) expect(entry).toMatch(/^v\d+$/)
  })

  it("stores each profile at the version its folder names", () => {
    for (const version of versionsOnDisk()) {
      for (const file of profilesIn(version)) {
        expect(read(version, file).v, `v${version}/${file}`).toBe(version)
      }
    }
  })

  // v4 stores the pre-rename pinyin class id, so the filename is compared
  // against what the id migrates TO, not what is literally stored.
  it("names each file after the class the profile resolves to", () => {
    for (const version of versionsOnDisk()) {
      for (const file of profilesIn(version)) {
        const stored = read(version, file).profile.inputs.classId
        expect(migrateClassId(stored), `v${version}/${file}`).toBe(file.replace(/\.json$/, ""))
      }
    }
  })
})

describe("no gaps — a class present at one version is present at every later one", () => {
  it.each([...CLASS_IDS()])("%s runs unbroken from its first version to the newest", (classId) => {
    const first = firstVersionOf(classId)
    expect(first, `${classId} has no profile at any version`).not.toBeNull()
    for (let version = first!; version < LATEST_PROFILES_VERSION; version++) {
      expect(profilesIn(version), `v${version} is missing ${classId}`).toContain(`${classId}.json`)
    }
  })
})

describe("a migration step requires captured profiles at the version it reads", () => {
  it.each(PROFILE_MIGRATIONS.map((step) => [step.name, step.to] as const))(
    "%s reads v%d-1, so that folder exists and is populated",
    (_name, to) => {
      expect(versionsOnDisk()).toContain(to - 1)
      expect(profilesIn(to - 1).length).toBeGreaterThan(0)
    },
  )

  // The frontier folder is the one the next step will read, so it is the one
  // that has to carry every class.
  it("covers every registered class at the newest stored version", () => {
    const classIds = profilesIn(LATEST_PROFILES_VERSION - 1).map((file) =>
      file.replace(/\.json$/, ""),
    )
    expect(classIds.sort()).toEqual([...CLASS_IDS()].sort())
  })
})
