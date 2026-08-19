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
  starReacher: "starReacher",
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
  // Thunderous Bloom L1–T6 capability flags. Tier 1 and tier 4 raise the
  // number of Spring Thunder stacks granted per trigger (3 → 4 → 5);
  // tier 3 extends the per-stack HP-Damage window; tier 6 makes 'restore a
  // stack on hitting Exhausted / <30% Qi with a Heavy / Heavy Pursuit /
  // Light / Ballistic skill' available. Tier 2 is a Solo-Mode-Level-shaped
  // phys multiplier and tier 5 raises physBoost — neither lives as a node,
  // both ride the tiered panelStats block.
  thunderousBloomIncreasedStackGrant: "thunderousBloomIncreasedStackGrant",
  thunderousBloomExtendedDamageWindow: "thunderousBloomExtendedDamageWindow",
  thunderousBloomRestoresStackOnExhausted: "thunderousBloomRestoresStackOnExhausted",
  // Blossom Barrage T3 carries no behavioral effect in the model — the
  // Combo window is unconditional 15s per the in-game Base Buff paragraph at
  // T6 (see `blossomBarrage.ts` header). The slot exists so the inner-way's
  // selectable-tiers list reflects the in-game ladder; see follow-up to
  // decide whether to drop T3 from `selectableTiers`.
  blossomBarrageLongerCombo: "blossomBarrageLongerCombo",
  // T4 awards Spring Away targets-3→5 and +damage (+5%, +10% on Exhausted)
  // when the target has Combo.
  blossomBarrageSpringAwayBoost: "blossomBarrageSpringAwayBoost",
  // T6 enables the charges-2→3 + per-cast-CD-reduction mechanic on Spring
  // Sorrow (Hitting an enemy with Combo from you: -5s CD, +25 Blossoms,
  // once per skill cast).
  blossomBarrageSpringSorrowTripleCharge: "blossomBarrageSpringSorrowTripleCharge",
  // Breaking Point T1 widens Disintegration duration; T4 raises the cap;
  // T6 makes Perfect-Dodge a +5 trigger.
  breakingPointExtendedDuration: "breakingPointExtendedDuration",
  breakingPointHigherStackCap: "breakingPointHigherStackCap",
  breakingPointPerfectDodgeTrigger: "breakingPointPerfectDodgeTrigger",
  // Star Reacher T1 widens the Lingering Bone Mark bonus to airborne targets
  // and gates the HP-conditional damage/heal split; T3 widens the bonus
  // duration 8s → 12s; T4 grants +Phys Attack on Exhausted / <30% Qi
  // targets; T6 raises the Lingering Bone / Airborne bonus magnitudes
  // (5%/10% → 7.5%/15%). The Tier 1 HP-gate and Tier 4 phase-gate bonuses
  // are not yet wired into the engine — flagged here as nodes so the test
  // suite pins their ownership, with the magnitudes living on the def.
  starReacherHpGatedLingeringBone: "starReacherHpGatedLingeringBone",
  starReacherExtendedDuration: "starReacherExtendedDuration",
  starReacherExhaustedBonus: "starReacherExhaustedBonus",
  starReacherRaisedBaseBonuses: "starReacherRaisedBaseBonuses",
} as const

export type InnerWayNode = (typeof INNER_WAY_NODE)[keyof typeof INNER_WAY_NODE]
