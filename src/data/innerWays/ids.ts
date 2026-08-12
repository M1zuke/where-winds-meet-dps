// Every inner-way id is pinned here so a dangling `ClassDef.classMindGroup` /
// `allowedMindMethods` reference becomes a build error. Persisted as
// `MindMethodSlot.id`; renaming a value here changes what a saved profile
// resolves to (see `docs/MIGRATIONS.md`).
export const INNER_WAY_ID = {
  bitterSeason: "bitterSeason",
  frostCladNight: "frostCladNight",
  insightfulStrike: "insightfulStrike",
  moraleChant: "moraleChant",
  steadfastDevotion: "steadfastDevotion",
  swordHorizon: "swordHorizon",
  throatPierce: "throatPierce",
  wolfchasersArt: "wolfchasersArt",
} as const

export type InnerWayId = (typeof INNER_WAY_ID)[keyof typeof INNER_WAY_ID]

// Every named tier capability an inner way's ladder can gate on — the closed
// list `innerWayNodeTier`/`innerWayHasNode` (`define.ts`) read against. A
// node carries no payload of its own; the magnitude it unlocks stays with
// whichever consumer reads the node (CALCULATION.md § "Inner-way layers").
export const INNER_WAY_NODE = {
  crosswindChargeRetention: "crosswindChargeRetention",
  dotDetonationRetention: "dotDetonationRetention",
  soulShaken: "soulShaken",
  concentrationDotMultiplier: "concentrationDotMultiplier",
  concentrationSustainPair: "concentrationSustainPair",
  yiRiver: "yiRiver",
  bitterSeasonStrongerDefenseReduction: "bitterSeasonStrongerDefenseReduction",
  bitterSeasonImprovedProcChance: "bitterSeasonImprovedProcChance",
  bitterSeasonMaxStackPenetration: "bitterSeasonMaxStackPenetration",
} as const

export type InnerWayNode = (typeof INNER_WAY_NODE)[keyof typeof INNER_WAY_NODE]
