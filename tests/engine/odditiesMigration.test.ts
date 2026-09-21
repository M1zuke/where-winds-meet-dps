import { beforeEach, describe, expect, it } from "vitest"
import { kvStore } from "../../src/kvStore"
import { loadProfiles, saveProfiles } from "../../src/storage"
import { defaultInputs } from "../../src/engine/defaults"
import { LATEST_PROFILES_VERSION } from "../../src/migrations"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"

function writeProfilesBlob(inputsOverrides: Partial<Inputs>): void {
  const inputs: Omit<Inputs, "unclaimedOddityNodes"> & { unclaimedOddityNodes?: unknown } = {
    ...defaultInputs,
    ...inputsOverrides,
  }
  if (!("unclaimedOddityNodes" in inputsOverrides)) delete inputs.unclaimedOddityNodes
  kvStore.set(
    PROFILES_KEY,
    JSON.stringify({
      v: LATEST_PROFILES_VERSION,
      profiles: [{ id: "p1", name: "Legacy", inputs }],
      activeId: "p1",
    }),
  )
}

describe("stored oddity board state", () => {
  beforeEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })

  it("claims every melody when the stored blob has no `unclaimedOddityNodes` key", () => {
    writeProfilesBlob({})
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.unclaimedOddityNodes).toEqual({})
  })

  it("keeps a stored region's released ids, closed over the chain, across a save", () => {
    writeProfilesBlob({ unclaimedOddityNodes: { Qinghe: [102] } })
    const first = loadProfiles()
    const stored = first.profiles[0].inputs.unclaimedOddityNodes.Qinghe
    expect(stored).toContain(102)
    expect(stored).toContain(105)

    saveProfiles({ profiles: first.profiles, activeId: first.activeId })
    const second = loadProfiles()
    expect(second.profiles[0].inputs.unclaimedOddityNodes).toEqual(
      first.profiles[0].inputs.unclaimedOddityNodes,
    )
  })

  it("drops ids that name no melody on that region's board", () => {
    writeProfilesBlob({ unclaimedOddityNodes: { Qinghe: [999999] } })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.unclaimedOddityNodes).toEqual({})
  })

  it("heals a malformed value back to a fully claimed board", () => {
    writeProfilesBlob({
      unclaimedOddityNodes: "not-an-object" as unknown as Inputs["unclaimedOddityNodes"],
    })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.unclaimedOddityNodes).toEqual({})
  })
})
