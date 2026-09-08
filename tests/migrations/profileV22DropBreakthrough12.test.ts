import { describe, expect, it } from "vitest"
import { V22__dropBreakthrough12 } from "../../src/migrations/V22__dropBreakthrough12"
import type { RawProfilesBlob } from "../../src/migrations/types"

function blobOf(breakthrough: unknown): RawProfilesBlob {
  return {
    v: 21,
    profiles: [{ id: "p1", name: "Legacy", inputs: { breakthrough, critRate: 0.4 } }],
    activeId: "p1",
  } as unknown as RawProfilesBlob
}

function breakthroughOf(blob: RawProfilesBlob): unknown {
  const profiles = blob.profiles as { inputs: Record<string, unknown> }[]
  return profiles[0].inputs.breakthrough
}

describe("V22 step — v21 → v22 in isolation", () => {
  it("raises a profile stored at the removed breakthrough 12 to the lowest that exists", () => {
    expect(breakthroughOf(V22__dropBreakthrough12.migrate(blobOf(12)))).toBe(13)
  })

  it("leaves every breakthrough that still exists alone", () => {
    for (const breakthrough of [13, 14, 16, 17, 18, 21]) {
      expect(breakthroughOf(V22__dropBreakthrough12.migrate(blobOf(breakthrough)))).toBe(
        breakthrough,
      )
    }
  })

  it("carries a neighbouring field across the step untouched", () => {
    const migrated = V22__dropBreakthrough12.migrate(blobOf(12))
    const profiles = migrated.profiles as { inputs: Record<string, unknown> }[]
    expect(profiles[0].inputs.critRate).toBe(0.4)
  })

  it("leaves a non-numeric breakthrough for the loader's own repair", () => {
    expect(breakthroughOf(V22__dropBreakthrough12.migrate(blobOf("twelve")))).toBe("twelve")
  })

  it("stamps the blob at version 22", () => {
    expect(V22__dropBreakthrough12.migrate(blobOf(12)).v).toBe(22)
  })
})
