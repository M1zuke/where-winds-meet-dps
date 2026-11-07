import { beforeEach, describe, expect, it } from "vitest"
import { kvStore } from "../../src/kvStore"
import { loadProfiles } from "../../src/storage"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"
const PROFILES_VERSION = 4

function writeProfilesBlob(storedInputs: Record<string, unknown>): void {
  kvStore.set(
    PROFILES_KEY,
    JSON.stringify({
      v: PROFILES_VERSION,
      profiles: [{ id: "p1", name: "Stored", inputs: storedInputs }],
      activeId: "p1",
    }),
  )
}

function storedInputsWithout(field: keyof Inputs): Record<string, unknown> {
  const { [field]: _omitted, ...rest } = defaultInputs
  void _omitted
  return rest
}

describe("Divinecraft refinement storage (additive field, no version bump)", () => {
  beforeEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })

  it("loads an old profile without the field as no refined item", () => {
    writeProfilesBlob(storedInputsWithout("divinecraftRefinement"))
    expect(loadProfiles().profiles[0].inputs.divinecraftRefinement).toBeNull()
  })

  it("keeps a stored refinement as written, whatever the enchant", () => {
    writeProfilesBlob({
      ...defaultInputs,
      divinecraft: "poison",
      divinecraftRefinement: "cinderAsh",
    })
    const { inputs } = loadProfiles().profiles[0]
    expect(inputs.divinecraft).toBe("poison")
    expect(inputs.divinecraftRefinement).toBe("cinderAsh")
  })

  it("keeps a refinement id this build does not define", () => {
    writeProfilesBlob({ ...defaultInputs, divinecraftRefinement: "futureItem" })
    expect(loadProfiles().profiles[0].inputs.divinecraftRefinement).toBe("futureItem")
  })

  it("replaces a non-string refinement with none", () => {
    writeProfilesBlob({ ...defaultInputs, divinecraftRefinement: 3 })
    expect(loadProfiles().profiles[0].inputs.divinecraftRefinement).toBeNull()
  })

  it("keeps a stored water enchant through hydration", () => {
    writeProfilesBlob({ ...defaultInputs, divinecraft: "water" })
    expect(loadProfiles().profiles[0].inputs.divinecraft).toBe("water")
  })

  it("hydrates idempotently", () => {
    writeProfilesBlob({ ...defaultInputs, divinecraft: "water", divinecraftRefinement: "deepPool" })
    const first = loadProfiles().profiles[0].inputs
    const second = loadProfiles().profiles[0].inputs
    expect(second.divinecraft).toBe("water")
    expect(second.divinecraftRefinement).toBe("deepPool")
    expect(second).toEqual(first)
  })
})
