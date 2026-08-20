// v14 → v15 — Swallowcall carried no modelled effect: no panel bonus, no
// formula bonus, no siteKey any buff gated on. Its `defineSet` call is gone, so
// a profile saved while it was selectable holds a `set` the picker can no
// longer show — a value that survives every save/export round-trip while
// reading as unset.
//
// Matches the id rather than the display name: V11 converted `Inputs.set`
// before this step runs. The id is frozen here rather than derived from
// `src/data/sets/`, for the same reason V14 froze its three — a later removal
// needs its own step instead of being applied retroactively by this one.
import type { Migration, RawProfilesBlob } from "./types"

const RETIRED_SET_ID = "swallowcall"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export const V15__dropSwallowcallSet: Migration = {
  to: 15,
  name: "V15__dropSwallowcallSet",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          if (profile.inputs.set !== RETIRED_SET_ID) return profile
          return { ...profile, inputs: { ...profile.inputs, set: null } }
        })
      : blob.profiles
    return { ...blob, v: 15, profiles }
  },
}
