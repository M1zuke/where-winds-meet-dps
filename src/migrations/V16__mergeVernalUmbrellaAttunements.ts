// v15 → v16 — the previous shape stored two Vernal Umbrella attunement ids on
// gear pieces, `umbSpecial` (Special Skill DMG Boost) and `umbCharged`
// (Charged Skill DMG Boost); patch 2.1 merged both affixes into the single
// `umbFrequentProjectile`, and a piece storing a retired id no longer resolves
// an attunement option, so its roll silently stops contributing. A saved copy
// of a built-in skill likewise still carries the retired `attune:` tag, which
// masks the healed-in merged tag because a skill's first attune tag wins.
import type { Migration, RawProfilesBlob } from "./types"

const MERGED_UMBRELLA_ATTUNEMENT = "umbFrequentProjectile"
const LEGACY_UMBRELLA_ATTUNEMENTS: ReadonlySet<string> = new Set(["umbSpecial", "umbCharged"])

export function migrateAttunementId(stored: string): string {
  return LEGACY_UMBRELLA_ATTUNEMENTS.has(stored) ? MERGED_UMBRELLA_ATTUNEMENT : stored
}

export function migrateAttuneTag(tag: string): string {
  const [prefix, id] = [tag.slice(0, "attune:".length), tag.slice("attune:".length)]
  return prefix === "attune:" ? "attune:" + migrateAttunementId(id) : tag
}

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function migratePieceAttunement(piece: unknown): unknown {
  if (!isRec(piece) || typeof piece.attunement !== "string") return piece
  const attunement = migrateAttunementId(piece.attunement)
  return attunement === piece.attunement ? piece : { ...piece, attunement }
}

export const V16__mergeVernalUmbrellaAttunements: Migration = {
  to: 16,
  name: "V16__mergeVernalUmbrellaAttunements",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          const inventory = profile.inputs.inventory
          if (!Array.isArray(inventory)) return profile
          return {
            ...profile,
            inputs: { ...profile.inputs, inventory: inventory.map(migratePieceAttunement) },
          }
        })
      : blob.profiles
    return { ...blob, v: 16, profiles }
  },
}
