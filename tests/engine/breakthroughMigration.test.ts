// Additive migration, no version bump — see CLAUDE.md → "localStorage migrations".
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { kvStore } from "../../src/kvStore"
import { loadProfiles } from "../../src/storage"
import { defaultInputs } from "../../src/engine/defaults"
import { BREAKTHROUGH_RELEASES } from "../../src/definitions/baseStats/breakthroughs"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"
const PROFILES_VERSION = 4

const BEFORE_EVERY_RELEASE = Math.min(...BREAKTHROUGH_RELEASES.map((release) => release.at)) - 1

function writeLegacyProfilesBlob(targetId: string | undefined, breakthrough?: unknown): void {
  const inputs: Partial<Inputs> & { targetId?: string } = { ...defaultInputs }
  delete inputs.breakthrough
  if (breakthrough !== undefined) {
    ;(inputs as Record<string, unknown>).breakthrough = breakthrough
  }
  if (targetId !== undefined) {
    inputs.targetId = targetId
  }
  kvStore.set(
    PROFILES_KEY,
    JSON.stringify({
      v: PROFILES_VERSION,
      profiles: [{ id: "p1", name: "Legacy", inputs }],
      activeId: "p1",
    }),
  )
}

// Pinned before every breakthrough release so these assert the legacy mapping
// rather than the release follow — see breakthroughRelease.test.ts.
describe("breakthrough migration (additive field, no version bump)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(BEFORE_EVERY_RELEASE)
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("maps legacy targetId '86' to breakthrough 13 and strips targetId", () => {
    writeLegacyProfilesBlob("86")
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.breakthrough).toBe(13)
    expect("targetId" in profiles[0].inputs).toBe(false)
  })

  it("maps a long legacy targetId form to its leading trial level", () => {
    writeLegacyProfilesBlob("96 — God of Avarice (Extreme)")
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.breakthrough).toBe(16)
  })

  it("falls back to the current default for a dropped low-level trial", () => {
    writeLegacyProfilesBlob("51")
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.breakthrough).toBe(16)
  })

  it("falls back to the current default when both targetId and breakthrough are missing", () => {
    writeLegacyProfilesBlob(undefined)
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.breakthrough).toBe(16)
  })

  it("preserves an already-valid breakthrough (idempotent) and strips a stale targetId", () => {
    writeLegacyProfilesBlob("86", 20)
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.breakthrough).toBe(20)
    expect("targetId" in profiles[0].inputs).toBe(false)
  })

  it("heals a malformed breakthrough value back to the current default", () => {
    writeLegacyProfilesBlob(undefined, "sixteen")
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.breakthrough).toBe(16)
  })

  it("heals an out-of-range breakthrough value back to the current default", () => {
    writeLegacyProfilesBlob(undefined, 99)
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.breakthrough).toBe(16)
  })
})
