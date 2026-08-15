// No imports of its own — every buff-def id and build-param name a JSON buff
// file or `BuffParams` carries, pinned so a dangling `requiresBuffActive` /
// `activeAfterBuffEnds.buffId` reference becomes a build error instead of a
// silently-never-firing buff.
export const BUFF = {
  battleAnthemEnduranceBoost: "battleAnthemEnduranceBoost",
  bellstrikeUmbraBleedPen: "bellstrikeUmbraBleedPen",
  bellstrikeUmbraBleedingDamage: "bellstrikeUmbraBleedingDamage",
  endlessGale: "endlessGale",
  burningHeartIPConsume: "burningHeartIPConsume",
  chargeEnhancement: "chargeEnhancement",
  concentration: "concentration",
  forgetfulness: "forgetfulness",
  frostCladSnowbreak: "frostCladSnowbreak",
  frostCladSnowbreakIPConsume: "frostCladSnowbreakIPConsume",
  frostCladSnowbreakT6: "frostCladSnowbreakT6",
  innerPassion: "innerPassion",
  ironGuards: "ironGuards",
  mountainSplitter: "mountainSplitter",
  mountainsMight: "mountainsMight",
  shatteredRidgeDeflect: "shatteredRidgeDeflect",
  stonesplitStrengthSkillCritDamage: "stonesplitStrengthSkillCritDamage",
  throatPierced: "throatPierced",
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
  swordEnergyEnhancement: "swordEnergyEnhancement",
  swordMorphEnduranceBoost: "swordMorphEnduranceBoost",
  swordSlashDamageBoost: "swordSlashDamageBoost",
  vulnerabilityTeammate: "vulnerabilityTeammate",
  wineGu: "wineGu",
} as const

// Harvested from every `enabledParam` / `bonus.valueFromParam` across
// `src/data/skills/buffs/*.ts` — see `src/data/innerWays/` for which of
// these an inner way declares as its `buffParam`.
export const PARAM = {
  allySurgingWaves: "allySurgingWaves",
  artOfResistance: "artOfResistance",
  battleAnthem: "battleAnthem",
  dragonHeadLowHpMaxBonus: "dragonHeadLowHpMaxBonus",
  fluteBoostValue: "fluteBoostValue",
  frostCladNight: "frostCladNight",
  insightfulStrike: "insightfulStrike",
  moraleChant: "moraleChant",
  mountainsMight: "mountainsMight",
  revelryScript: "revelryScript",
  starsAlignActive: "starsAlignActive",
  steadfastDevotion: "steadfastDevotion",
  swordHorizon: "swordHorizon",
  swordMorph: "swordMorph",
  throatPierced: "throatPierced",
  wolfchasersArt: "wolfchasersArt",
} as const
