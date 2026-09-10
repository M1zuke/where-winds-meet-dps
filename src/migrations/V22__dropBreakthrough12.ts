// v21 → v22 — breakthrough 12 no longer exists: it sat on gear level 81, which
// this app does not model. `getBreakthrough` throws on an unknown tier, so a
// profile still holding 12 would fail to load rather than score wrongly.
import type { Migration, RawProfilesBlob } from "./types"

const LOWEST_BREAKTHROUGH = 13

function isRec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function raiseBreakthrough(inputs: Record<string, unknown>): Record<string, unknown> {
  const stored = inputs.breakthrough
  if (typeof stored !== "number" || stored >= LOWEST_BREAKTHROUGH) return inputs
  return { ...inputs, breakthrough: LOWEST_BREAKTHROUGH }
}

export const V22__dropBreakthrough12: Migration = {
  to: 22,
  name: "V22__dropBreakthrough12",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: raiseBreakthrough(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 22, profiles }
  },
}
