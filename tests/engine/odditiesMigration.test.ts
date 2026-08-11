// Additive field, no version bump — see CLAUDE.md → "localStorage migrations".
import { beforeEach, describe, expect, it } from "vitest"
import { kvStore } from "../../src/kvStore"
import { loadProfiles, saveProfiles } from "../../src/storage"
import { DEFAULT_ODDITIES } from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"
const PROFILES_VERSION = 4

function writeProfilesBlob(inputsOverrides: Partial<Inputs>): void {
  const inputs: Omit<Inputs, "oddities"> & { oddities?: unknown } = {
    ...defaultInputs,
    ...inputsOverrides,
  }
  if (!("oddities" in inputsOverrides)) delete inputs.oddities
  kvStore.set(
    PROFILES_KEY,
    JSON.stringify({
      v: PROFILES_VERSION,
      profiles: [{ id: "p1", name: "Legacy", inputs }],
      activeId: "p1",
    }),
  )
}

describe("oddities migration (additive field, no version bump)", () => {
  beforeEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })

  it("seeds DEFAULT_ODDITIES when the stored blob has no `oddities` key", () => {
    writeProfilesBlob({})
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.oddities).toEqual(DEFAULT_ODDITIES)
  })

  it("preserves a custom `oddities` table already on the blob (idempotent)", () => {
    const custom = {
      Qinghe: [{ id: 1, stat: "maxPhys" as const, value: 999, enabled: false }],
    }
    writeProfilesBlob({ oddities: custom })
    const first = loadProfiles()
    expect(first.profiles[0].inputs.oddities.Qinghe).toEqual(custom.Qinghe)
    const expectedKeys = new Set(Object.keys(DEFAULT_ODDITIES))
    expect(new Set(Object.keys(first.profiles[0].inputs.oddities))).toEqual(expectedKeys)

    saveProfiles({ profiles: first.profiles, activeId: first.activeId })
    const second = loadProfiles()
    expect(second.profiles[0].inputs.oddities).toEqual(first.profiles[0].inputs.oddities)
  })

  it("merges regions added to oddities.json after the profile was saved", () => {
    const stored = JSON.parse(JSON.stringify(DEFAULT_ODDITIES)) as Inputs["oddities"]
    delete stored["Hidden Mountain: Suixiang"]
    stored.Qinghe[0] = { ...stored.Qinghe[0], enabled: false }
    writeProfilesBlob({ oddities: stored })

    const { profiles } = loadProfiles()
    const oddities = profiles[0].inputs.oddities
    expect(oddities["Hidden Mountain: Suixiang"]).toEqual(
      DEFAULT_ODDITIES["Hidden Mountain: Suixiang"],
    )
    expect(oddities.Qinghe[0].enabled).toBe(false)
  })

  it("heals a malformed `oddities` value back to the default", () => {
    writeProfilesBlob({ oddities: "not-an-object" as unknown as Inputs["oddities"] })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.oddities).toEqual(DEFAULT_ODDITIES)
  })

  it("heals individual malformed nodes but keeps the region structure", () => {
    const custom = {
      Qinghe: [{ id: 1, stat: "maxPhys", value: 5 }, null],
    }
    writeProfilesBlob({ oddities: custom as unknown as Inputs["oddities"] })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.oddities.Qinghe).toEqual([
      { id: 1, stat: "maxPhys", value: 5, enabled: true, icon: undefined },
    ])
  })
})
