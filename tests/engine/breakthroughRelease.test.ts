import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { kvStore } from "../../src/kvStore"
import { loadProfiles, saveProfiles } from "../../src/storage"
import { defaultInputs } from "../../src/engine/defaults"
import {
  BREAKTHROUGH_RELEASES,
  defaultBreakthrough,
  newestBreakthroughRelease,
  releasedBreakthroughs,
} from "../../src/definitions/baseStats/breakthroughs"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"
const PROFILES_VERSION = 4

const BREAKTHROUGH_17_RELEASE = BREAKTHROUGH_RELEASES.find(
  (release) => release.breakthrough === 17,
)!.at

function writeProfiles(builds: readonly Partial<Inputs>[]): void {
  kvStore.set(
    PROFILES_KEY,
    JSON.stringify({
      v: PROFILES_VERSION,
      profiles: builds.map((build, index) => ({
        id: `p${index}`,
        name: `Profile ${index}`,
        inputs: { ...defaultInputs, followedBreakthroughRelease: undefined, ...build },
      })),
      activeId: "p0",
    }),
  )
}

function loadedBreakthroughs(): number[] {
  return loadProfiles().profiles.map((profile) => profile.inputs.breakthrough)
}

function storedBreakthroughs(): number[] {
  const blob = JSON.parse(kvStore.get(PROFILES_KEY) ?? "{}") as { profiles?: { inputs: Inputs }[] }
  return (blob.profiles ?? []).map((profile) => profile.inputs.breakthrough)
}

beforeEach(() => {
  vi.useFakeTimers()
  try {
    kvStore.remove(PROFILES_KEY)
  } catch {}
})

afterEach(() => {
  vi.useRealTimers()
})

describe("breakthrough release schedule", () => {
  it("reads each release date off the tier it belongs to", () => {
    expect(new Date(BREAKTHROUGH_17_RELEASE).toISOString()).toBe("2026-09-03T03:30:00.000Z")
  })

  it("keeps the releases ordered by date", () => {
    const dates = BREAKTHROUGH_RELEASES.map((release) => release.at)
    expect(dates).toEqual([...dates].sort((left, right) => left - right))
  })

  it("counts no release as pending before its date", () => {
    expect(releasedBreakthroughs(BREAKTHROUGH_17_RELEASE - 1)).not.toContainEqual({
      breakthrough: 17,
      at: BREAKTHROUGH_17_RELEASE,
    })
  })
})

describe("defaultBreakthrough", () => {
  it("holds the old default up to the last instant before the release", () => {
    expect(defaultBreakthrough(BREAKTHROUGH_17_RELEASE - 1)).toBe(16)
  })

  it("flips at the release instant itself", () => {
    expect(defaultBreakthrough(BREAKTHROUGH_17_RELEASE)).toBe(17)
  })

  it("flips at the same moment worldwide, not at each viewer's local 05:30", () => {
    const tokyoMorning = Date.parse("2026-09-03T05:30:00+09:00")
    const berlinMorning = Date.parse("2026-09-03T05:30:00+02:00")
    const losAngelesMorning = Date.parse("2026-09-03T05:30:00-07:00")
    expect(defaultBreakthrough(tokyoMorning)).toBe(16)
    expect(defaultBreakthrough(berlinMorning)).toBe(17)
    expect(defaultBreakthrough(losAngelesMorning)).toBe(17)
  })

  it("never drops below the pre-release default", () => {
    expect(newestBreakthroughRelease(0)).toBe(0)
    expect(defaultBreakthrough(0)).toBe(16)
  })
})

describe("following a breakthrough release", () => {
  it("leaves saved profiles alone before the release", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE - 1)
    writeProfiles([{ breakthrough: 16 }, { breakthrough: 14 }])
    expect(loadedBreakthroughs()).toEqual([16, 14])
  })

  it("moves every profile still on the superseded default up to 17", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 16 }, { breakthrough: 16 }])
    expect(loadedBreakthroughs()).toEqual([17, 17])
  })

  it("leaves a deliberately chosen breakthrough untouched", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 12 }, { breakthrough: 14 }, { breakthrough: 21 }])
    expect(loadedBreakthroughs()).toEqual([12, 14, 21])
  })

  it("persists the follow so it happens once, not per load", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 16 }])
    loadProfiles()
    expect(storedBreakthroughs()).toEqual([17])
  })

  it("stamps the profile rather than a global localStorage entry", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 16 }])
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.followedBreakthroughRelease).toBe(17)
    expect(Object.keys(localStorage)).toEqual([PROFILES_KEY])
  })

  it("does not follow twice, so re-picking the superseded default sticks", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 16, followedBreakthroughRelease: 17 }])
    expect(loadedBreakthroughs()).toEqual([16])
  })

  it("follows each profile independently", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 16 }, { breakthrough: 16, followedBreakthroughRelease: 17 }])
    expect(loadedBreakthroughs()).toEqual([17, 16])
  })

  it("keeps the stamp across a save round trip", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 16 }])
    saveProfiles(loadProfiles())
    const blob = JSON.parse(kvStore.get(PROFILES_KEY) ?? "{}") as { profiles: { inputs: Inputs }[] }
    expect(blob.profiles[0].inputs.followedBreakthroughRelease).toBe(17)
  })

  it("writes storage on the load that follows, and not on the next one", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 16 }])
    loadProfiles()
    const writes = vi.spyOn(kvStore, "set")
    expect(loadedBreakthroughs()).toEqual([17])
    expect(writes).not.toHaveBeenCalled()
    writes.mockRestore()
  })

  it("re-picking the superseded default after the follow survives a reload", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 16 }])
    const followed = loadProfiles()
    expect(followed.profiles[0].inputs.breakthrough).toBe(17)
    saveProfiles({
      ...followed,
      profiles: [
        {
          ...followed.profiles[0],
          inputs: { ...followed.profiles[0].inputs, breakthrough: 16 },
        },
      ],
    })
    expect(loadedBreakthroughs()).toEqual([16])
  })

  it("changes nothing on the build but the breakthrough and the stamp", () => {
    vi.setSystemTime(BREAKTHROUGH_17_RELEASE)
    writeProfiles([{ breakthrough: 16 }, { breakthrough: 14 }])
    const [followed, untouched] = loadProfiles().profiles
    expect({ ...followed.inputs, breakthrough: 14 }).toEqual(untouched.inputs)
  })
})
