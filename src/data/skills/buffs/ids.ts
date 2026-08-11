// No imports of its own — every buff-def id and build-param name a JSON buff
// file or `BuffParams` carries, pinned so a dangling `requiresBuffActive` /
// `activeAfterBuffEnds.buffId` reference becomes a build error instead of a
// silently-never-firing buff.
export const BUFF = {
  bellstrikeUmbraBleedPen: "bellstrikeUmbraBleedPen",
  bellstrikeUmbraBleedingDamage: "bellstrikeUmbraBleedingDamage",
  concentration: "concentration",
  dragonHeadLowHp: "dragonHeadLowHp",
  fluteBoost: "fluteBoost",
  healerBuff: "healerBuff",
  jadeware: "jadeware",
  lingeringBone: "lingeringBone",
  mirage: "mirage",
  mirageBonus: "mirageBonus",
  potentRiverFlow: "potentRiverFlow",
  rainwhisperShield: "rainwhisperShield",
  resistanceResolve: "resistanceResolve",
  revelryScript: "revelryScript",
  soulShaken: "soulShaken",
  surgingWaves: "surgingWaves",
  vulnerabilityTeammate: "vulnerabilityTeammate",
  wineGu: "wineGu",
} as const

// Harvested from every `enabledParam` / `bonus.valueFromParam` across
// `src/data/skills/buffs/*.ts` — see `src/data/innerWays/` for which of
// these an inner way declares as its `buffParam`.
export const PARAM = {
  allySurgingWaves: "allySurgingWaves",
  artOfResistance: "artOfResistance",
  dragonHeadLowHpMaxBonus: "dragonHeadLowHpMaxBonus",
  fluteBoostValue: "fluteBoostValue",
  insightfulStrike: "insightfulStrike",
  moraleChant: "moraleChant",
  revelryScript: "revelryScript",
  starsAlignActive: "starsAlignActive",
  swordHorizon: "swordHorizon",
  wolfchasersArt: "wolfchasersArt",
} as const
