// Every inner-way id is pinned here so a dangling `ClassDef.classMindGroup` /
// `allowedMindMethods` reference becomes a build error. Persisted as
// `MindMethodSlot.id`; renaming a value here changes what a saved profile
// resolves to (see `docs/MIGRATIONS.md`).
export const INNER_WAY_ID = {
  battleAnthem: "battleAnthem",
  bitterSeason: "bitterSeason",
  blossomBarrage: "blossomBarrage",
  breakingPoint: "breakingPoint",
  frostCladNight: "frostCladNight",
  insightfulStrike: "insightfulStrike",
  moraleChant: "moraleChant",
  mountainsMight: "mountainsMight",
  steadfastDevotion: "steadfastDevotion",
  swordHorizon: "swordHorizon",
  swordMorph: "swordMorph",
  throatPierce: "throatPierce",
  thunderousBloom: "thunderousBloom",
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
  // Thunderous Bloom L1–T6 capability flags. Tier 1 shortens the distance
  // threshold; tier 4 raises the heavy-attack charge cap; tier 5 raises the
  // phys-boost; tier 6 makes 'restore a stack on hitting Exhausted / <30% Qi'
  // available. Tier 2 is a Solo-Mode-Level-shaped phys multiplier and tier 3
  // is a Qi-DMG-Bonus delivery — neither lives as a node, both ride the
  // tiered scalr block.
  thunderousBloomShortenedDistance: "thunderousBloomShortenedDistance",
  thunderousBloomRestoresStackOnExhausted: "thunderousBloomRestoresStackOnExhausted",
  // Blossom Barrage T3 widens the Combo window and gates Spring Sorrow's
  // cast-speed contribution; T4 awards Spring Away targets-5 and +damage;
  // T6 enables the charges-3 + per-cast-CD-reduction mechanic.
  blossomBarrageLongerCombo: "blossomBarrageLongerCombo",
  blossomBarrageSpringAwayBoost: "blossomBarrageSpringAwayBoost",
  blossomBarrageSpringSorrowTripleCharge: "blossomBarrageSpringSorrowTripleCharge",
  // Breaking Point T1 widens Disintegration duration; T4 raises the cap;
  // T6 makes Perfect-Dodge a +5 trigger.
  breakingPointExtendedDuration: "breakingPointExtendedDuration",
  breakingPointHigherStackCap: "breakingPointHigherStackCap",
  breakingPointPerfectDodgeTrigger: "breakingPointPerfectDodgeTrigger",
} as const

export type InnerWayNode = (typeof INNER_WAY_NODE)[keyof typeof INNER_WAY_NODE]
