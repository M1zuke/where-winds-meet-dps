// v7 → v8 — Ivorybloom and Rainwhisper were removed from the armor-set data,
// so a profile saved while they were selectable holds a `set` the picker can no
// longer show. Nothing errors on it: `applyArmorSet`, `formula.ts setValue` and
// `APP_SET_TO_SITE_SET` all simply miss, so the value survives every save/export
// round-trip while reading as unset everywhere it matters.
//
// The removed names are frozen here rather than derived from `ARMOR_SET_OPTIONS`:
// this step is a one-time hop for these two sets, so a later removal needs its
// own step instead of being retroactively applied by this one. The standing
// "must be selectable" invariant lives in `hydrateInputs`, which also covers the
// two paths that never walk this chain — the legacy `wwm.inputs` blob and a bare
// (unwrapped) imported profile.
import type { Migration, RawProfilesBlob } from "./types"

const REMOVED_SETS = new Set(["Ivorybloom", "Rainwhisper", "Rainwhisper (no shield)"])

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export const V8__dropRemovedArmorSets: Migration = {
  to: 8,
  name: "V8__dropRemovedArmorSets",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          const set = profile.inputs.set
          if (typeof set !== "string" || !REMOVED_SETS.has(set)) return profile
          return { ...profile, inputs: { ...profile.inputs, set: null } }
        })
      : blob.profiles
    return { ...blob, v: 8, profiles }
  },
}
