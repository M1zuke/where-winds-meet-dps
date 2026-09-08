import type { GearLevel, GearSlot } from "../../engine/types"
import type { GearWordId } from "./statLines"

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
  helmArmor: ["affinity", "crit", "precision"],
  greavesBracer: ["affinity", "crit", "power", "precision"],
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
  helmArmor: ["affinity", "crit", "precision"],
  greavesBracer: ["affinity", "crit", "power", "precision"],
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
  helmArmor: ["affinity", "crit", "precision"],
  greavesBracer: ["affinity", "crit", "power", "precision"],
}

const RETUNE_86: PoolByGroup = {
  weapon: [
    "affinity",
    "agility",
    "crit",
    "dualKnivesBoost",
    "fanBoost",
    "hengDaoBoost",
    "maxPhys",
    "minPhys",
    "modaoBoost",
    "momentum",
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
    "crit",
    "dualKnivesBoost",
    "fanBoost",
    "hengDaoBoost",
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
    "modaoBoost",
    "momentum",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
    "umbrellaBoost",
  ],
  helmArmor: [
    "affinity",
    "agility",
    "areaMysticBoost",
    "crit",
    "dualKnivesBoost",
    "fanBoost",
    "hengDaoBoost",
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
    "modaoBoost",
    "momentum",
    "power",
    "precision",
    "ropeDartBoost",
    "singleTargetMysticBoost",
    "spearBoost",
    "swordBoost",
    "umbrellaBoost",
  ],
  greavesBracer: [
    "affinity",
    "agility",
    "crit",
    "damageVsBoss",
    "dualKnivesBoost",
    "fanBoost",
    "hengDaoBoost",
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
    "modaoBoost",
    "momentum",
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
    "crit",
    "dualKnivesBoost",
    "hengDaoBoost",
    "maxPhys",
    "minPhys",
    "modaoBoost",
    "momentum",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
  ],
  discPendant: [
    "affinity",
    "agility",
    "allMartialBoost",
    "crit",
    "dualKnivesBoost",
    "hengDaoBoost",
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
    "modaoBoost",
    "momentum",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
  ],
  helmArmor: [
    "affinity",
    "agility",
    "areaMysticBoost",
    "crit",
    "dualKnivesBoost",
    "hengDaoBoost",
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
    "modaoBoost",
    "momentum",
    "power",
    "precision",
    "ropeDartBoost",
    "singleTargetMysticBoost",
    "spearBoost",
    "swordBoost",
  ],
  greavesBracer: [
    "affinity",
    "agility",
    "crit",
    "damageVsBoss",
    "dualKnivesBoost",
    "hengDaoBoost",
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
    "modaoBoost",
    "momentum",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
  ],
}

const RETUNE_96_TO_105: PoolByGroup = {
  weapon: [
    "affinity",
    "agility",
    "crit",
    "dualKnivesBoost",
    "hengDaoBoost",
    "maxFormless",
    "maxPhys",
    "minFormless",
    "minPhys",
    "modaoBoost",
    "momentum",
    "power",
    "precision",
    "ropeDartBoost",
    "spearBoost",
    "swordBoost",
  ],
  discPendant: [
    "affinity",
    "agility",
    "allMartialBoost",
    "crit",
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
    "power",
    "precision",
  ],
  helmArmor: [
    "affinity",
    "agility",
    "areaMysticBoost",
    "crit",
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
    "power",
    "precision",
    "singleTargetMysticBoost",
  ],
  greavesBracer: [
    "affinity",
    "agility",
    "crit",
    "damageVsBoss",
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
    "power",
    "precision",
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
  96: RETUNE_96_TO_105,
  100: RETUNE_96_TO_105,
  105: RETUNE_96_TO_105,
}

function poolFor(
  pools: Readonly<Record<GearLevel, PoolByGroup>>,
  level: GearLevel,
  slot: GearSlot,
): readonly GearWordId[] {
  return pools[level][gearWordSlotGroup(slot)]
}

export function gearWordPoolInitial(level: GearLevel, slot: GearSlot): readonly GearWordId[] {
  return poolFor(INITIAL_POOLS, level, slot)
}

export function gearWordPoolRetune(level: GearLevel, slot: GearSlot): readonly GearWordId[] {
  return poolFor(RETUNE_POOLS, level, slot)
}

export function isRetunableLine(lineIndex: number): boolean {
  return lineIndex > 0
}

export function gearWordPoolForLine(
  level: GearLevel,
  slot: GearSlot,
  lineIndex: number,
): readonly GearWordId[] {
  return isRetunableLine(lineIndex)
    ? gearWordPoolRetune(level, slot)
    : gearWordPoolInitial(level, slot)
}

export function gearWordPool(level: GearLevel, slot: GearSlot): readonly GearWordId[] {
  return [...new Set([...gearWordPoolInitial(level, slot), ...gearWordPoolRetune(level, slot)])]
}
