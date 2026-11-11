import type { GearLevel, GearSlot, WeaponName } from "../../engine/types"
import type { GearWordId } from "./statLines"
import { WEAPON_BOOST_STAT_KEY } from "./weaponBoosts"

export type GearWordSlotGroup = "weapon" | "discPendant" | "helmArmor" | "greavesBracer"

export function gearWordSlotGroup(slot: GearSlot): GearWordSlotGroup {
  switch (slot) {
    case "leftWeapon":
    case "rightWeapon":
      return "weapon"
    case "disc":
    case "pendant":
      return "discPendant"
    case "helm":
    case "armor":
      return "helmArmor"
    case "greaves":
    case "bracer":
      return "greavesBracer"
  }
}

type PoolByGroup = Readonly<Record<GearWordSlotGroup, readonly GearWordId[]>>

const INITIAL_86: PoolByGroup = {
  weapon: [
    "agility",
    "maxBamboocut",
    "maxBellstrike",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "momentum",
  ],
  discPendant: [
    "maxBamboocut",
    "maxBellstrike",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
  ],
  helmArmor: ["affinity", "crit", "maxHp", "physDef", "precision"],
  greavesBracer: ["affinity", "body", "crit", "maxHp", "physDef", "power", "precision"],
}

const INITIAL_91: PoolByGroup = {
  weapon: [
    "agility",
    "maxBamboocut",
    "maxBellstrike",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "momentum",
  ],
  discPendant: [
    "maxBamboocut",
    "maxBellstrike",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
  ],
  helmArmor: ["affinity", "crit", "maxHp", "physDef", "precision"],
  greavesBracer: ["affinity", "body", "crit", "maxHp", "physDef", "power", "precision"],
}

const INITIAL_96_TO_105: PoolByGroup = {
  weapon: [
    "agility",
    "maxBamboocut",
    "maxBellstrike",
    "maxFormless",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minFormless",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "momentum",
  ],
  discPendant: ["maxPhys", "minPhys"],
  helmArmor: ["affinity", "crit", "maxHp", "physDef", "precision"],
  greavesBracer: ["affinity", "body", "crit", "maxHp", "physDef", "power", "precision"],
}

const RETUNE_86: PoolByGroup = {
  weapon: [
    "affinity",
    "agility",
    "body",
    "crit",
    "defense",
    "dualKnivesBoost",
    "fanBoost",
    "gauntletsBoost",
    "hengDaoBoost",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "modaoBoost",
    "momentum",
    "physDef",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
    "umbrellaBoost",
  ],
  discPendant: [
    "affinity",
    "agility",
    "allMartialBoost",
    "body",
    "crit",
    "defense",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "momentum",
    "physDef",
    "power",
    "precision",
  ],
  helmArmor: [
    "affinity",
    "agility",
    "areaDamageMysticBoost",
    "areaDebuffMysticBoost",
    "areaMysticBoost",
    "body",
    "crit",
    "defense",
    "dualKnivesBoost",
    "fanBoost",
    "hengDaoBoost",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "modaoBoost",
    "momentum",
    "physDef",
    "power",
    "precision",
    "ropeDartBoost",
    "singleTargetBurstMysticBoost",
    "singleTargetControlMysticBoost",
    "singleTargetMysticBoost",
    "spearBoost",
    "swordBoost",
    "umbrellaBoost",
  ],
  greavesBracer: [
    "affinity",
    "agility",
    "body",
    "crit",
    "damageVsBoss",
    "damageVsPlayer",
    "defense",
    "dualKnivesBoost",
    "fanBoost",
    "hengDaoBoost",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "modaoBoost",
    "momentum",
    "physDef",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
    "umbrellaBoost",
  ],
}

const RETUNE_91: PoolByGroup = {
  weapon: [
    "affinity",
    "agility",
    "body",
    "crit",
    "defense",
    "dualKnivesBoost",
    "fanBoost",
    "gauntletsBoost",
    "hengDaoBoost",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "modaoBoost",
    "momentum",
    "physDef",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
    "umbrellaBoost",
  ],
  discPendant: [
    "affinity",
    "agility",
    "allMartialBoost",
    "body",
    "crit",
    "defense",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "momentum",
    "physDef",
    "power",
    "precision",
  ],
  helmArmor: [
    "affinity",
    "agility",
    "areaDamageMysticBoost",
    "areaDebuffMysticBoost",
    "areaMysticBoost",
    "body",
    "crit",
    "defense",
    "dualKnivesBoost",
    "fanBoost",
    "hengDaoBoost",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "modaoBoost",
    "momentum",
    "physDef",
    "power",
    "precision",
    "ropeDartBoost",
    "singleTargetBurstMysticBoost",
    "singleTargetControlMysticBoost",
    "singleTargetMysticBoost",
    "spearBoost",
    "swordBoost",
    "umbrellaBoost",
  ],
  greavesBracer: [
    "affinity",
    "agility",
    "body",
    "crit",
    "damageVsBoss",
    "damageVsPlayer",
    "defense",
    "dualKnivesBoost",
    "fanBoost",
    "hengDaoBoost",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "modaoBoost",
    "momentum",
    "physDef",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
    "umbrellaBoost",
  ],
}

const RETUNE_96: PoolByGroup = {
  weapon: [
    "affinity",
    "agility",
    "body",
    "crit",
    "defense",
    "dualKnivesBoost",
    "fanBoost",
    "gauntletsBoost",
    "hengDaoBoost",
    "maxBamboocut",
    "maxBellstrike",
    "maxFormless",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minFormless",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "modaoBoost",
    "momentum",
    "physDef",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
    "umbrellaBoost",
  ],
  discPendant: [
    "affinity",
    "agility",
    "allMartialBoost",
    "body",
    "crit",
    "defense",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "momentum",
    "physDef",
    "power",
    "precision",
  ],
  helmArmor: [
    "affinity",
    "agility",
    "areaMysticBoost",
    "body",
    "crit",
    "defense",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "momentum",
    "physDef",
    "power",
    "precision",
    "singleTargetMysticBoost",
  ],
  greavesBracer: [
    "affinity",
    "agility",
    "body",
    "crit",
    "damageVsBoss",
    "damageVsPlayer",
    "defense",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "momentum",
    "physDef",
    "power",
    "precision",
  ],
}

const RETUNE_100_TO_105: PoolByGroup = {
  ...RETUNE_96,
  helmArmor: [
    "affinity",
    "agility",
    "allMysticBoost",
    "areaMysticBoost",
    "body",
    "crit",
    "defense",
    "maxBamboocut",
    "maxBellstrike",
    "maxHp",
    "maxPhys",
    "maxSilkbind",
    "maxStonesplit",
    "minBamboocut",
    "minBellstrike",
    "minPhys",
    "minSilkbind",
    "minStonesplit",
    "momentum",
    "physDef",
    "power",
    "precision",
    "singleTargetMysticBoost",
  ],
}

const INITIAL_POOLS: Readonly<Record<GearLevel, PoolByGroup>> = {
  86: INITIAL_86,
  91: INITIAL_91,
  96: INITIAL_96_TO_105,
  100: INITIAL_96_TO_105,
  105: INITIAL_96_TO_105,
}

const RETUNE_POOLS: Readonly<Record<GearLevel, PoolByGroup>> = {
  86: RETUNE_86,
  91: RETUNE_91,
  96: RETUNE_96,
  100: RETUNE_100_TO_105,
  105: RETUNE_100_TO_105,
}

const ALL_MYSTIC_BOOST_LEVEL: GearLevel = 100

const MYSTIC_SUBTYPE_LINE_AT_LEVEL: Readonly<
  Record<string, Readonly<Record<GearLevel, GearWordId>>>
> = {
  areaDebuffMysticBoost: {
    86: "areaDebuffMysticBoost",
    91: "areaDebuffMysticBoost",
    96: "areaMysticBoost",
    100: "allMysticBoost",
    105: "allMysticBoost",
  },
  areaDamageMysticBoost: {
    86: "areaDamageMysticBoost",
    91: "areaDamageMysticBoost",
    96: "areaMysticBoost",
    100: "allMysticBoost",
    105: "allMysticBoost",
  },
  singleTargetControlMysticBoost: {
    86: "singleTargetControlMysticBoost",
    91: "singleTargetControlMysticBoost",
    96: "singleTargetMysticBoost",
    100: "allMysticBoost",
    105: "allMysticBoost",
  },
  singleTargetBurstMysticBoost: {
    86: "singleTargetBurstMysticBoost",
    91: "singleTargetBurstMysticBoost",
    96: "singleTargetMysticBoost",
    100: "allMysticBoost",
    105: "allMysticBoost",
  },
  areaMysticBoost: {
    86: "areaDamageMysticBoost",
    91: "areaDamageMysticBoost",
    96: "areaMysticBoost",
    100: "allMysticBoost",
    105: "allMysticBoost",
  },
  singleTargetMysticBoost: {
    86: "singleTargetBurstMysticBoost",
    91: "singleTargetBurstMysticBoost",
    96: "singleTargetMysticBoost",
    100: "allMysticBoost",
    105: "allMysticBoost",
  },
}

export function gearWordRelayedToLevel(
  word: GearWordId,
  fromLevel: GearLevel,
  toLevel: GearLevel,
): GearWordId {
  if (fromLevel === toLevel || fromLevel >= ALL_MYSTIC_BOOST_LEVEL) return word
  return MYSTIC_SUBTYPE_LINE_AT_LEVEL[word]?.[toLevel] ?? word
}

const WEAPON_ART_BOOST_WORDS: ReadonlySet<string> = new Set(Object.values(WEAPON_BOOST_STAT_KEY))

function poolFor(
  pools: Readonly<Record<GearLevel, PoolByGroup>>,
  level: GearLevel,
  slot: GearSlot,
  weapon: WeaponName | null,
): readonly GearWordId[] {
  const group = gearWordSlotGroup(slot)
  const pool = pools[level][group]
  if (group !== "weapon" || weapon === null) return pool
  const ownBoost: string | undefined = WEAPON_BOOST_STAT_KEY[weapon]
  return pool.filter((word) => !WEAPON_ART_BOOST_WORDS.has(word) || word === ownBoost)
}

export function gearWordPoolInitial(
  level: GearLevel,
  slot: GearSlot,
  weapon: WeaponName | null,
): readonly GearWordId[] {
  return poolFor(INITIAL_POOLS, level, slot, weapon)
}

export function gearWordPoolRetune(
  level: GearLevel,
  slot: GearSlot,
  weapon: WeaponName | null,
): readonly GearWordId[] {
  return poolFor(RETUNE_POOLS, level, slot, weapon)
}

export function isRetunableLine(lineIndex: number): boolean {
  return lineIndex > 0
}

export function gearWordPoolForLine(
  level: GearLevel,
  slot: GearSlot,
  lineIndex: number,
  weapon: WeaponName | null,
): readonly GearWordId[] {
  return isRetunableLine(lineIndex)
    ? gearWordPoolRetune(level, slot, weapon)
    : gearWordPoolInitial(level, slot, weapon)
}

export function gearWordPool(
  level: GearLevel,
  slot: GearSlot,
  weapon: WeaponName | null,
): readonly GearWordId[] {
  return [
    ...new Set([
      ...gearWordPoolInitial(level, slot, weapon),
      ...gearWordPoolRetune(level, slot, weapon),
    ]),
  ]
}
