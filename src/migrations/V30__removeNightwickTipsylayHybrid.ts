// v29 → v30 — the Bamboocut Draught module that paired Tipsylay's values with
// Primepick's timing is gone, and the module that carried Tipsylay's real
// values is the one still shipped under the older Primepick id. A saved
// rotation step naming the removed id would otherwise resolve to nothing and
// silently cost the hit.
// The ids are frozen here rather than read from the live library, for the same
// reason V14 and V15 froze their set ids.
import type { Migration, RawProfilesBlob } from "./types"

const REMOVED_SKILL_ID = "bamboocutDraught-nightwick-tipsylay"
const SURVIVING_SKILL_ID = "bamboocutDraught-nightwick-primepick"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function migrateNightwickTipsylayId<T>(id: T): T {
  return (id === REMOVED_SKILL_ID ? SURVIVING_SKILL_ID : id) as T
}

export function migrateRotationNightwickTipsylayIds<T>(rotation: T): T {
  if (!isRec(rotation) || !Array.isArray(rotation.steps)) return rotation
  return {
    ...rotation,
    steps: rotation.steps.map((step) =>
      isRec(step) ? { ...step, skillId: migrateNightwickTipsylayId(step.skillId) } : step,
    ),
  } as T
}

export const V30__removeNightwickTipsylayHybrid: Migration = {
  to: 30,
  name: "V30__removeNightwickTipsylayHybrid",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          if (!("activeCustomRotation" in profile.inputs)) return profile
          return {
            ...profile,
            inputs: {
              ...profile.inputs,
              activeCustomRotation: migrateRotationNightwickTipsylayIds(
                profile.inputs.activeCustomRotation,
              ),
            },
          }
        })
      : blob.profiles
    return { ...blob, v: 30, profiles }
  },
}
