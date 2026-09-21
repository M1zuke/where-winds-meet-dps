// v28 -> v29 — the Divinecraft element was persisted as `tianGongElement`; the
// field now carries the English name the game and the panel use.
import type { Migration, RawProfilesBlob } from "./types"

const LEGACY_KEY = "tianGongElement"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function migrateDivinecraftField(inputs: Record<string, unknown>): Record<string, unknown> {
  if (!(LEGACY_KEY in inputs)) return inputs
  const { [LEGACY_KEY]: legacy, ...rest } = inputs
  return "divinecraft" in inputs ? rest : { ...rest, divinecraft: legacy }
}

export const V29__divinecraftElement: Migration = {
  to: 29,
  name: "V29__divinecraftElement",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: migrateDivinecraftField(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 29, profiles }
  },
}
