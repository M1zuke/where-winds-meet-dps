// v13 → v14 — Swift Gale, Swaying Heights and Stars Align carried no modelled
// effect: no panel bonus, no formula bonus, and in Stars Align's case a param
// nothing consumed. Their `defineSet` calls are gone, so a profile saved while
// they were selectable holds a `set` the picker can no longer show. Nothing
// errors on it — `applyArmorSet` and `SET_BY_ID` simply miss — so the value
// would survive every save/export round-trip while reading as unset.
//
// Matches ids rather than display names: V11 already converted `Inputs.set` to
// the stable id, and this step runs after it. The ids are frozen here rather
// than derived from `src/data/sets/`, for the same reason V8 froze its names —
// a later removal needs its own step instead of being applied retroactively by
// this one.
import type { Migration, RawProfilesBlob } from "./types"

const UNIMPLEMENTED_SET_IDS = new Set(["swiftGale", "swayingHeights", "starsAlign"])

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export const V14__dropUnimplementedArmorSets: Migration = {
  to: 14,
  name: "V14__dropUnimplementedArmorSets",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          const set = profile.inputs.set
          if (typeof set !== "string" || !UNIMPLEMENTED_SET_IDS.has(set)) return profile
          return { ...profile, inputs: { ...profile.inputs, set: null } }
        })
      : blob.profiles
    return { ...blob, v: 14, profiles }
  },
}
