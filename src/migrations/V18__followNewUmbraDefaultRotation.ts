// v17 → v18 — the Umbra rotation pool lost four built-ins and gained a new
// class default. Two stored selections have to move, for different reasons:
//
// A retired id names a rotation the picker can no longer show. Nothing errors
// on it — the lookup misses and the engine falls back to the class default —
// so the selection reads as unset while the dead id survives every save/export
// round-trip. It can never become legitimate again, so `hydrateInputs` clears
// it unconditionally too, for the paths that never walk the chain.
//
// The previous default id names a rotation that is still offered, so a profile
// holding it is either following the default or has deliberately picked it,
// and storage cannot tell the two apart. Unpinning it belongs to this one hop
// and MUST NOT reach the hydrator: run on every load it would take the choice
// away from anyone who picks that rotation from now on.
//
// The ids are frozen here rather than derived from the live rotation library,
// for the same reason V14 and V15 froze their set ids: a later removal needs
// its own step instead of being applied retroactively by this one.
import type { Migration, RawProfilesBlob } from "./types"

const RETIRED_ROTATION_IDS = new Set([
  "builtin-bellstrikeUmbra-eazy",
  "builtin-bellstrikeUmbra-eazy-t6-wolf",
  "builtin-bellstrikeUmbra-focus-t6-wolf",
  "builtin-bellstrikeUmbra-t6-bili",
])

const PREVIOUS_DEFAULT_ROTATION_ID = "builtin-bellstrikeUmbra-36-bbs"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function dropRetiredRotationId<T>(stored: T): T | null {
  return typeof stored === "string" && RETIRED_ROTATION_IDS.has(stored) ? null : stored
}

function followsNewDefault(stored: unknown): boolean {
  return (
    typeof stored === "string" &&
    (RETIRED_ROTATION_IDS.has(stored) || stored === PREVIOUS_DEFAULT_ROTATION_ID)
  )
}

export const V18__followNewUmbraDefaultRotation: Migration = {
  to: 18,
  name: "V18__followNewUmbraDefaultRotation",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          if (!followsNewDefault(profile.inputs.selectedBuiltinRotationId)) return profile
          return {
            ...profile,
            inputs: { ...profile.inputs, selectedBuiltinRotationId: null },
          }
        })
      : blob.profiles
    return { ...blob, v: 18, profiles }
  },
}
