// The layout rule for the per-store fixture folders, enforced rather than
// described: one folder per stored version from the chain's floor up to the
// version before the latest, each holding the store blob at that version.
// Adding a step is what makes a new folder mandatory — without this a step
// could ship with no captured store at the version it reads.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  LATEST_CUSTOM_SKILLS_VERSION,
  OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION,
} from "../../src/migrations/customSkills"
import {
  LATEST_CUSTOM_DEBUFFS_VERSION,
  OLDEST_MIGRATABLE_CUSTOM_DEBUFFS_VERSION,
} from "../../src/migrations/customDebuffs"

const STORES = [
  {
    name: "testCustomSkills",
    oldest: OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION,
    latest: LATEST_CUSTOM_SKILLS_VERSION,
    list: "skills",
  },
  {
    name: "testCustomDebuffs",
    oldest: OLDEST_MIGRATABLE_CUSTOM_DEBUFFS_VERSION,
    latest: LATEST_CUSTOM_DEBUFFS_VERSION,
    list: "debuffs",
  },
]

describe.each(STORES.map((store) => [store.name, store] as const))("%s layout", (_name, store) => {
  const root = join(process.cwd(), "tests/migrations", store.name)
  const folders = () =>
    readdirSync(root).filter((entry) => statSync(join(root, entry)).isDirectory())

  it("holds nothing but version folders", () => {
    const stray = readdirSync(root).filter((entry) => !statSync(join(root, entry)).isDirectory())
    expect(stray).toEqual([])
    for (const entry of folders()) expect(entry).toMatch(/^v\d+$/)
  })

  it("has a folder for every version a step reads, and none the chain cannot walk", () => {
    const expected = Array.from(
      { length: store.latest - store.oldest },
      (_, index) => `v${store.oldest + index}`,
    )
    expect(folders().sort()).toEqual(expected.sort())
  })

  it("stores each blob at the version its folder names, as a non-empty list", () => {
    for (const folder of folders()) {
      const files = readdirSync(join(root, folder))
      expect(files, folder).toEqual(["store.json"])
      const blob = JSON.parse(readFileSync(join(root, folder, "store.json"), "utf8")) as Record<
        string,
        unknown
      >
      expect(blob.v, folder).toBe(Number(folder.slice(1)))
      expect(
        Array.isArray(blob[store.list]) && (blob[store.list] as unknown[]).length > 0,
        folder,
      ).toBe(true)
    }
  })
})
