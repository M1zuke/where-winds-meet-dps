// Every inner-way id is pinned here so a dangling `ClassDef.classMindGroup` /
// `allowedMindMethods` reference becomes a build error. Persisted as
// `MindMethodSlot.id`; renaming a value here changes what a saved profile
// resolves to (see `docs/MIGRATIONS.md`).
export const INNER_WAY_ID = {
  battleAnthem: "battleAnthem",
  bitterSeason: "bitterSeason",
  blossomBarrage: "blossomBarrage",
  breakingPoint: "breakingPoint",
  eonpour: "eonpour",
  frostCladNight: "frostCladNight",
  insightfulStrike: "insightfulStrike",
  mistwing: "mistwing",
  moraleChant: "moraleChant",
  mountainsMight: "mountainsMight",
  skyspeak: "skyspeak",
  starReacher: "starReacher",
  steadfastDevotion: "steadfastDevotion",
  swordHorizon: "swordHorizon",
  swordMorph: "swordMorph",
  throatPierce: "throatPierce",
  thunderousBloom: "thunderousBloom",
  volutefit: "volutefit",
  wolfchasersArt: "wolfchasersArt",
} as const

export type InnerWayId = (typeof INNER_WAY_ID)[keyof typeof INNER_WAY_ID]

// Every named tier capability an inner way's ladder can gate on — the closed
// list `innerWayNodeTier`/`innerWayHasNode` (`define.ts`) read against. A
// node carries no payload of its own; the magnitude it unlocks stays with
// whichever consumer reads the node (CALCULATION.md § "Inner-way layers").
export const INNER_WAY_NODE = {
  battleAnthemEnduranceBonus: "battleAnthemEnduranceBonus",
  crosswindChargeRetention: "crosswindChargeRetention",
  energySurge: "energySurge",
  exhaustedSwordEnergyOutcome: "exhaustedSwordEnergyOutcome",
  qiImbalanceOnMartialArt: "qiImbalanceOnMartialArt",
  dotDetonationRetention: "dotDetonationRetention",
  soulShaken: "soulShaken",
  concentrationDotMultiplier: "concentrationDotMultiplier",
  concentrationSustainPair: "concentrationSustainPair",
  yiRiver: "yiRiver",
  bitterSeasonStrongerDefenseReduction: "bitterSeasonStrongerDefenseReduction",
  bitterSeasonImprovedProcChance: "bitterSeasonImprovedProcChance",
  bitterSeasonMaxStackPenetration: "bitterSeasonMaxStackPenetration",
  blossomBarrageSpringAwayBonus: "blossomBarrageSpringAwayBonus",
  breakingPointPerfectDodgeStacks: "breakingPointPerfectDodgeStacks",
  dragonquenchUnlock: "dragonquenchUnlock",
  lightAttackBingeBonus: "lightAttackBingeBonus",
  heroSBloodInebriateUnlock: "heroSBloodInebriateUnlock",
  deepdazeDuration: "deepdazeDuration",
  drunkslayRepeatedDamage: "drunkslayRepeatedDamage",
} as const

export type InnerWayNode = (typeof INNER_WAY_NODE)[keyof typeof INNER_WAY_NODE]

export const INNER_WAY_LADDER = {
  weaponAttackFourStar: "weaponAttackFourStar",
  weaponAttackFiveStar: "weaponAttackFiveStar",
  weaponAttackMinFiveStar: "weaponAttackMinFiveStar",
  weaponAttackMaxFiveStar: "weaponAttackMaxFiveStar",
  precisionFourStar: "precisionFourStar",
  critRateFourStar: "critRateFourStar",
  critRateFiveStar: "critRateFiveStar",
  affinityRateFourStar: "affinityRateFourStar",
  attributeAttackFourStar: "attributeAttackFourStar",
} as const

export type InnerWayLadderId = (typeof INNER_WAY_LADDER)[keyof typeof INNER_WAY_LADDER]
