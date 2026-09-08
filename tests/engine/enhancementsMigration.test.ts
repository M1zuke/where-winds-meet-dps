import { beforeEach, describe, expect, it } from "vitest"
import { kvStore } from "../../src/kvStore"
import { loadProfiles, saveProfiles } from "../../src/storage"
import { DEFAULT_ENHANCEMENTS } from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import { LATEST_PROFILES_VERSION } from "../../src/migrations"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"

function writeProfilesBlob(inputsOverrides: Partial<Inputs>): void {
  const inputs: Omit<Inputs, "enhancements"> & { enhancements?: unknown } = {
    ...defaultInputs,
    ...inputsOverrides,
  }
  if (!("enhancements" in inputsOverrides)) delete inputs.enhancements
  kvStore.set(
    PROFILES_KEY,
    JSON.stringify({
      v: LATEST_PROFILES_VERSION,
      profiles: [{ id: "p1", name: "Legacy", inputs }],
      activeId: "p1",
    }),
  )
}

describe("enhancement levels — the every-load hydrator", () => {
  beforeEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })

  it("seeds every slot at level 65 when the stored blob has no `enhancements` key", () => {
    writeProfilesBlob({})
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual(DEFAULT_ENHANCEMENTS)
  })

  it("preserves a lowered level already on the blob (idempotent)", () => {
    const lowered = { ...DEFAULT_ENHANCEMENTS, disc: 12 }
    writeProfilesBlob({ enhancements: lowered })
    const first = loadProfiles()
    expect(first.profiles[0].inputs.enhancements).toEqual(lowered)

    saveProfiles({ profiles: first.profiles, activeId: first.activeId })
    const second = loadProfiles()
    expect(second.profiles[0].inputs.enhancements).toEqual(lowered)
  })

  it("fills a slot missing from the stored object with the default level", () => {
    const partial = { leftWeapon: 40, rightWeapon: 40 }
    writeProfilesBlob({ enhancements: partial as unknown as Inputs["enhancements"] })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual({
      ...DEFAULT_ENHANCEMENTS,
      leftWeapon: 40,
      rightWeapon: 40,
    })
  })

  it("never clamps a stored level down to the current cap", () => {
    const inflated = Object.fromEntries(
      Object.entries(DEFAULT_ENHANCEMENTS).map(([slot, level]) => [slot, level + 500]),
    ) as Inputs["enhancements"]
    writeProfilesBlob({ enhancements: inflated })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual(inflated)
  })

  it("heals a malformed `enhancements` value back to the default", () => {
    writeProfilesBlob({ enhancements: "not-an-object" as unknown as Inputs["enhancements"] })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual(DEFAULT_ENHANCEMENTS)
  })

  it("drops a slot the current build no longer defines", () => {
    const withStrayKey = {
      ...DEFAULT_ENHANCEMENTS,
      notASlot: 40,
    } as unknown as Inputs["enhancements"]
    writeProfilesBlob({ enhancements: withStrayKey })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual(DEFAULT_ENHANCEMENTS)
  })
})
