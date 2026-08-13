// v11 → v12 — a gear word used to be stored as its English display name, which
// made the display string the identity. It now stores the stable
// `StatLineDef.id` from `src/data/stats/statLines.ts`, so a label can be
// corrected without touching saved gear.
//
// The previous shape is the specification here: the keys are every name a
// profile can hold, including the ones an earlier build already renamed once
// (the mystic-boost splits and the Formless attack pair). Frozen rather than
// derived from the stat-line table — this step is a one-time hop, so a later
// rename needs its own step.
import type { Migration, RawProfilesBlob } from "./types"

const LEGACY_GEAR_WORD_TO_ID: Readonly<Record<string, string>> = {
  Power: "power",
  Agility: "agility",
  Momentum: "momentum",
  "Min Phys": "minPhys",
  "Max Phys": "maxPhys",
  Precision: "precision",
  Crit: "crit",
  Affinity: "affinity",
  "All Martial Boost": "allMartialBoost",
  "Sword Martial Boost": "swordBoost",
  "Spear Martial Boost": "spearBoost",
  "Fan Martial Boost": "fanBoost",
  "Umbrella Martial Boost": "umbrellaBoost",
  "Modao Martial Boost": "modaoBoost",
  "Twin Blades Martial Boost": "dualKnivesBoost",
  "Rope Dart Martial Boost": "ropeDartBoost",
  "Hengdao Martial Boost": "hengDaoBoost",
  "Damage VS Boss %": "damageVsBoss",
  "Single-Target Mystic Skill DMG Boost": "singleTargetMysticBoost",
  "Area Mystic Skill DMG Boost": "areaMysticBoost",
  "Min Bellstrike": "minBellstrike",
  "Max Bellstrike": "maxBellstrike",
  "Min Stonesplit": "minStonesplit",
  "Max Stonesplit": "maxStonesplit",
  "Min Silkbind": "minSilkbind",
  "Max Silkbind": "maxSilkbind",
  "Min Bamboocut": "minBamboocut",
  "Max Bamboocut": "maxBamboocut",
  "Min Void Attack": "minVoidAttack",
  "Max Void Attack": "maxVoidAttack",
  "Physical Penetration": "physicalPenetration",
  "Attribute Penetration": "formlessPenetration",
  "Single Burst": "singleTargetMysticBoost",
  "Single Control": "singleTargetMysticBoost",
  "AoE Anomaly": "areaMysticBoost",
  "AoE Damage": "areaMysticBoost",
  "Area Debuff Mystic Skill DMG Boost": "areaMysticBoost",
  "Area DMG Mystic Skill DMG Boost": "areaMysticBoost",
  "Min Formless": "minVoidAttack",
  "Max Formless": "maxVoidAttack",
}

export function migrateGearWordId(storedWord: string): string {
  return LEGACY_GEAR_WORD_TO_ID[storedWord] ?? storedWord
}

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function migratePieceWords(piece: unknown): unknown {
  if (!isRec(piece) || !Array.isArray(piece.words)) return piece
  const words = piece.words.map((entry) =>
    isRec(entry) && typeof entry.word === "string"
      ? { ...entry, word: migrateGearWordId(entry.word) }
      : entry,
  )
  return { ...piece, words }
}

export const V12__gearWordIds: Migration = {
  to: 12,
  name: "V12__gearWordIds",
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
    return { ...blob, v: 12, profiles }
  },
}
