// v30 → v31 — the preferred distance to the target was one encounter setting,
// `combatSettings.preferredDistanceMeters`; it is now the rotation's own. The
// profile's value moves onto its active custom rotation, and a built-in
// rotation carries its own value.
import type { Migration, RawProfilesBlob } from "./types"

const FIELD = "preferredDistanceMeters"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function movePreferredDistanceOntoRotation(
  inputs: Record<string, unknown>,
): Record<string, unknown> {
  const combatSettings = inputs.combatSettings
  if (!isRec(combatSettings) || !(FIELD in combatSettings)) return inputs
  const { [FIELD]: stored, ...remainingSettings } = combatSettings
  const moved: Record<string, unknown> = { ...inputs, combatSettings: remainingSettings }
  const rotation = inputs.activeCustomRotation
  const carriesValue = typeof stored === "number" && Number.isFinite(stored)
  if (isRec(rotation) && !(FIELD in rotation) && carriesValue)
    moved.activeCustomRotation = { ...rotation, [FIELD]: stored }
  return moved
}

export const V31__preferredDistanceOnRotation: Migration = {
  to: 31,
  name: "V31__preferredDistanceOnRotation",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: movePreferredDistanceOntoRotation(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 31, profiles }
  },
}
