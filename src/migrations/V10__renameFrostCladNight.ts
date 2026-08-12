import type { Migration, RawProfilesBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export const V10__renameFrostCladNight: Migration = {
  to: 10,
  name: "V10__renameFrostCladNight",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRecord(profile) || !isRecord(profile.inputs)) return profile
          const mindMethods = profile.inputs.mindMethods
          if (!Array.isArray(mindMethods)) return profile
          const renamed = mindMethods.map((slot) =>
            isRecord(slot) && slot.name === "Frostwhite Night"
              ? { ...slot, name: "Frost-Clad Night" }
              : slot,
          )
          return { ...profile, inputs: { ...profile.inputs, mindMethods: renamed } }
        })
      : blob.profiles
    return { ...blob, v: 10, profiles }
  },
}
