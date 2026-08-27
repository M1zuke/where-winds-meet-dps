// v16 -> v17 — rename the persisted set and buff identifiers.
import type { Migration, RawProfilesBlob } from "./types"

const LEGACY_SET_ID = "shatteredRidge"
const CLEFTPEAK_SET_ID = "cleftpeak"
const LEGACY_BUFF_ID = "shatteredRidgeDeflect"
const CLEFTPEAK_BUFF_ID = "cleftpeakDeflect"
const LEGACY_BOOST_TAG = "prop:shatteredRidgeBoost"
const CLEFTPEAK_BOOST_TAG = "prop:cleftpeakBoost"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function migrateCleftpeakSetId(rawSet: unknown): unknown {
  return rawSet === LEGACY_SET_ID ? CLEFTPEAK_SET_ID : rawSet
}

export function migrateCleftpeakBuffId(buffId: string): string {
  return buffId === LEGACY_BUFF_ID ? CLEFTPEAK_BUFF_ID : buffId
}

export function migrateCleftpeakTag(tag: string): string {
  return tag === LEGACY_BOOST_TAG ? CLEFTPEAK_BOOST_TAG : tag
}

function migrateRotation(rotation: unknown): unknown {
  if (!isRec(rotation) || !Array.isArray(rotation.permanentBuffIds)) return rotation
  return {
    ...rotation,
    permanentBuffIds: rotation.permanentBuffIds.map((buffId) =>
      typeof buffId === "string" ? migrateCleftpeakBuffId(buffId) : buffId,
    ),
  }
}

function migrateInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  const migrated: Record<string, unknown> = {
    ...inputs,
    set: migrateCleftpeakSetId(inputs.set),
  }
  if ("activeCustomRotation" in inputs) {
    migrated.activeCustomRotation = migrateRotation(inputs.activeCustomRotation)
  }
  return migrated
}

export const V17__renameCleftpeak: Migration = {
  to: 17,
  name: "V17__renameCleftpeak",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? {
                ...profile,
                inputs: migrateInputs(profile.inputs),
              }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 17, profiles }
  },
}
