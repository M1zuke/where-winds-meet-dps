import { beforeEach, describe, expect, it } from "vitest"
import { kvStore } from "../../src/kvStore"
import { loadProfiles, saveProfiles } from "../../src/storage"
import { DEFAULT_ENHANCEMENTS } from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"
const PROFILES_VERSION = 4

function writeProfilesBlob(inputsOverrides: Partial<Inputs>): void {
  const inputs: Omit<Inputs, "enhancements"> & { enhancements?: unknown } = {
    ...defaultInputs,
    ...inputsOverrides,
  }
  if (!("enhancements" in inputsOverrides)) delete inputs.enhancements
  kvStore.set(
    PROFILES_KEY,
    JSON.stringify({
      v: PROFILES_VERSION,
      profiles: [{ id: "p1", name: "Legacy", inputs }],
      activeId: "p1",
    }),
  )
}

describe("enhancements migration (additive field, no version bump)", () => {
  beforeEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })

  it("seeds DEFAULT_ENHANCEMENTS when the stored blob has no `enhancements` key", () => {
    writeProfilesBlob({})
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual(DEFAULT_ENHANCEMENTS)
  })

  it("preserves a lowered value already on the blob (idempotent)", () => {
    const lowered = DEFAULT_ENHANCEMENTS.map((node) =>
      node.id === 1 ? { ...node, value: 12 } : { ...node },
    )
    writeProfilesBlob({ enhancements: lowered })
    const first = loadProfiles()
    expect(first.profiles[0].inputs.enhancements).toEqual(lowered)

    saveProfiles({ profiles: first.profiles, activeId: first.activeId })
    const second = loadProfiles()
    expect(second.profiles[0].inputs.enhancements).toEqual(lowered)
  })

  it("merges entries added to enhancements.json after the profile was saved", () => {
    const partial = DEFAULT_ENHANCEMENTS.slice(0, 2).map((node) => ({ ...node }))
    writeProfilesBlob({ enhancements: partial })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual(DEFAULT_ENHANCEMENTS)
  })

  it("clamps a stored value above the figure enhancements.json authors", () => {
    const inflated = DEFAULT_ENHANCEMENTS.map((node) => ({ ...node, value: node.value + 500 }))
    writeProfilesBlob({ enhancements: inflated })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual(DEFAULT_ENHANCEMENTS)
  })

  it("heals a malformed `enhancements` value back to the default", () => {
    writeProfilesBlob({ enhancements: "not-an-array" as unknown as Inputs["enhancements"] })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual(DEFAULT_ENHANCEMENTS)
  })

  it("keeps an entry this build no longer defines rather than dropping it", () => {
    const unknownId = Math.max(...DEFAULT_ENHANCEMENTS.map((node) => node.id)) + 1
    const stored = [
      ...DEFAULT_ENHANCEMENTS.map((node) => ({ ...node })),
      { id: unknownId, slot: "helm", stat: "maxPhys", value: 42 },
    ]
    writeProfilesBlob({ enhancements: stored as unknown as Inputs["enhancements"] })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toContainEqual({
      id: unknownId,
      slot: "helm",
      stat: "maxPhys",
      value: 42,
    })
  })
})
