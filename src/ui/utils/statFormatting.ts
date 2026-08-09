export const PATH_LABELS: Record<string, string> = {
  "phys.min": "Min Phys",
  "phys.max": "Max Phys",
  "phys.penetration": "Physical Penetration",
  "bellstrike.min": "Min Bellstrike",
  "bellstrike.max": "Max Bellstrike",
  "bellstrike.penetration": "Bellstrike Penetration",
  "stonesplit.min": "Min Stonesplit",
  "stonesplit.max": "Max Stonesplit",
  "stonesplit.penetration": "Stonesplit Penetration",
  "silkbind.min": "Min Silkbind",
  "silkbind.max": "Max Silkbind",
  "silkbind.penetration": "Silkbind Penetration",
  "bamboocut.min": "Min Bamboocut",
  "bamboocut.max": "Max Bamboocut",
  "bamboocut.penetration": "Bamboocut Penetration",
  precision: "Precision",
  critRate: "Crit",
  affinityRate: "Affinity",
  directCritRate: "Direct Crit",
  directAffinityRate: "Direct Affinity",
  physBoost: "Physical Damage Boost",
  critDamageBoost: "Crit Damage Boost",
  affinityDamageBoost: "Affinity Damage Boost",
  attributeDamageBoost: "Attribute Damage Boost",
  sustainDamageBoost: "Sustain Damage Boost",
  allMartialBoost: "All Martial Boost",
  swordBoost: "Sword Martial Boost",
  spearBoost: "Spear Martial Boost",
  fanBoost: "Fan Martial Boost",
  umbrellaBoost: "Umbrella Martial Boost",
  modaoBoost: "Modao Martial Boost",
  dualKnivesBoost: "Twin Blades Martial Boost",
  ropeDartBoost: "Rope Dart Martial Boost",
  hengDaoBoost: "Hengdao Martial Boost",
  bossBoost: "Damage VS Boss %",
  singleMysticBoost: "Single-Target Mystic Skill DMG Boost",
  areaMysticBoost: "Area Mystic Skill DMG Boost",
  hp: "HP",
  physDef: "Phys Defense",
}

export const PERCENT_PATHS = new Set<string>([
  "precision",
  "critRate",
  "affinityRate",
  "directCritRate",
  "directAffinityRate",
  "physBoost",
  "critDamageBoost",
  "affinityDamageBoost",
  "attributeDamageBoost",
  "sustainDamageBoost",
  "allMartialBoost",
  "swordBoost",
  "spearBoost",
  "fanBoost",
  "umbrellaBoost",
  "modaoBoost",
  "dualKnivesBoost",
  "ropeDartBoost",
  "hengDaoBoost",
  "bossBoost",
  "singleMysticBoost",
  "areaMysticBoost",
])

export const PENETRATION_PATHS = new Set<string>([
  "phys.penetration",
  "bellstrike.penetration",
  "stonesplit.penetration",
  "silkbind.penetration",
  "bamboocut.penetration",
])

export function fmtPenetration(value: number): string {
  if (!Number.isFinite(value)) return "—"
  return String(Math.round(value * 1000) / 10)
}

export function fmt(value: number, isPercent: boolean, isPenetration = false): string {
  if (!Number.isFinite(value)) return "—"
  if (isPenetration) return fmtPenetration(value)
  if (isPercent) return `${(value * 100).toFixed(2)}%`
  if (Math.abs(value) < 0.01 && value !== 0) return value.toFixed(4)
  return value.toFixed(2)
}

export function readPath(obj: unknown, path: string): number {
  const parts = path.split(".")
  let cur: unknown = obj
  for (const p of parts) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p]
    else return 0
  }
  return typeof cur === "number" ? cur : 0
}
