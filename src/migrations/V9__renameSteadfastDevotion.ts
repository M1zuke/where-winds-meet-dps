import type { Migration, RawProfilesBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export const V9__renameSteadfastDevotion: Migration = {
  to: 9,
  name: "V9__renameSteadfastDevotion",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRecord(profile) || !isRecord(profile.inputs)) return profile
          const mindMethods = profile.inputs.mindMethods
          if (!Array.isArray(mindMethods)) return profile
          const renamed = mindMethods.map((slot) =>
            isRecord(slot) && slot.name === "Lone Loyalty"
              ? { ...slot, name: "Steadfast Devotion" }
              : slot,
          )
          return { ...profile, inputs: { ...profile.inputs, mindMethods: renamed } }
        })
      : blob.profiles
    return { ...blob, v: 9, profiles }
  },
}
