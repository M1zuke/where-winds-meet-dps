// v12 → v13 — V12 translated a stored gear word from its display name to a
// stat-line id, but its frozen table only holds the names in use *before* the
// stat-line labels were reworded. A profile written between the rewording and
// V12 stores the reworded label, which V12 passes through untouched and the
// loader's word repair then clears to an empty roll.
//
// The previous shape is the specification here: the keys are every label such a
// profile can hold — including the ones V12's own table covers, because a blob
// already at v12 never runs V12. Frozen rather than read from the stat-line
// table for the same reason V12's is: a later rewording is a later step, and
// deriving these would silently re-point this one.
import type { Migration, RawProfilesBlob } from "./types"

const CURRENT_LABEL_TO_ID: Readonly<Record<string, string>> = {
  Power: "power",
  Agility: "agility",
  Momentum: "momentum",
  "Precision Rate": "precision",
  "Critical Rate": "crit",
  "Affinity Rate": "affinity",
  "All Martial Boost": "allMartialBoost",
  "Art of Sword DMG Boost": "swordBoost",
  "Art of Spear DMG Boost": "spearBoost",
  "Art of Fan DMG Boost": "fanBoost",
  "Art of Umbrella DMG Boost": "umbrellaBoost",
  "Art of Modao DMG Boost": "modaoBoost",
  "Art of Twin Blades DMG Boost": "dualKnivesBoost",
  "Art of Rope Dart DMG Boost": "ropeDartBoost",
  "Art of Hengdao DMG Boost": "hengDaoBoost",
  "Combat Boost Against Boss Units": "damageVsBoss",
  "Single-Target Mystic Skill DMG Boost": "singleTargetMysticBoost",
  "Area Mystic Skill DMG Boost": "areaMysticBoost",
  "Min Physical Attack": "minPhys",
  "Max Physical Attack": "maxPhys",
  "Physical Penetration": "physicalPenetration",
  "Min Bellstrike Attack": "minBellstrike",
  "Max Bellstrike Attack": "maxBellstrike",
  "Min Stonesplit Attack": "minStonesplit",
  "Max Stonesplit Attack": "maxStonesplit",
  "Min Silkbind Attack": "minSilkbind",
  "Max Silkbind Attack": "maxSilkbind",
  "Min Bamboocut Attack": "minBamboocut",
  "Max Bamboocut Attack": "maxBamboocut",
  "Min Void Attack": "minVoidAttack",
  "Max Void Attack": "maxVoidAttack",
  "Formless Penetration": "formlessPenetration",
  "Phys Defense": "physDef",
}

export function migrateCurrentGearWordLabel(storedWord: string): string {
  return CURRENT_LABEL_TO_ID[storedWord] ?? storedWord
}

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function migratePieceWords(piece: unknown): unknown {
  if (!isRec(piece) || !Array.isArray(piece.words)) return piece
  const words = piece.words.map((entry) =>
    isRec(entry) && typeof entry.word === "string"
      ? { ...entry, word: migrateCurrentGearWordLabel(entry.word) }
      : entry,
  )
  return { ...piece, words }
}

export const V13__gearWordCurrentLabels: Migration = {
  to: 13,
  name: "V13__gearWordCurrentLabels",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          const inventory = profile.inputs.inventory
          if (!Array.isArray(inventory)) return profile
          return {
            ...profile,
            inputs: { ...profile.inputs, inventory: inventory.map(migratePieceWords) },
          }
        })
      : blob.profiles
    return { ...blob, v: 13, profiles }
  },
}
