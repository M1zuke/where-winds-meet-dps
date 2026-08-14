// No imports of its own — the leaf every skill/buff module points at, so two
// mutually-referencing entities (e.g. a bleed tick and its detonation) can
// never form an import cycle through here.
//
// Every string value is byte-identical to what the JSON skill/debuff files
// already carry — these tables exist to PIN those strings, not to rename
// them. A saved rotation or a user's edited skill matches a built-in by id,
// so changing a value here would silently stop that match.

export const CAST = {
  anxiSoldierHeng: "cast:anxiSoldierHeng",
  anxiSoldierMoDown: "cast:anxiSoldierMoDown",
  anxiSoldierMoJump: "cast:anxiSoldierMoJump",
  anxiSoldierMoSweep: "cast:anxiSoldierMoSweep",
  bitterSeasonTick: "cast:bitterSeasonTick",
  blockPerception: "cast:blockPerception",
  bleedDetonation: "cast:bleedDetonation",
  bleedTick: "cast:bleedTick",
  crosswindBlade: "cast:crosswindBlade",
  deflect: "cast:deflect",
  deflectCancel: "cast:deflectCancel",
  deflectCancelPrepull: "cast:deflectCancelPrepull",
  delay: "cast:delay",
  dragonHead: "cast:dragonHead",
  dragonHeadPlus: "cast:dragonHeadPlus",
  dragonSBreath1Hit: "cast:dragonSBreath1Hit",
  dragonSBreath1HitPrepull: "cast:dragonSBreath1HitPrepull",
  dragonSBreath2Hits: "cast:dragonSBreath2Hits",
  dragonSBreathSmolder1Hit: "cast:dragonSBreathSmolder1Hit",
  dragonSBreathSmolder2Hits: "cast:dragonSBreathSmolder2Hits",
  drunkenPoetPrepull: "cast:drunkenPoetPrepull",
  fluteOfTheTidesCancel: "cast:fluteOfTheTidesCancel",
  fluteOfTheTidesFull: "cast:fluteOfTheTidesFull",
  fluteOfTheTidesPrepull: "cast:fluteOfTheTidesPrepull",
  ghostlySteps: "cast:ghostlySteps",
  goldenBodyCancel: "cast:goldenBodyCancel",
  goldenBodyDeflectCancel: "cast:goldenBodyDeflectCancel",
  perfectDodge: "cast:perfectDodge",
  perfectDodgeFull: "cast:perfectDodgeFull",
  phalanxChargedS3: "cast:phalanxChargedS3",
  phalanxChargedS3InnerPassion: "cast:phalanxChargedS3InnerPassion",
  phalanxQ: "cast:phalanxQ",
  phalanxSpecial: "cast:phalanxSpecial",
  phalanxSpecialPrepull: "cast:phalanxSpecialPrepull",
  poet1: "cast:poet1",
  poet2: "cast:poet2",
  poet3: "cast:poet3",
  poet4: "cast:poet4",
  poetFinalHitCancel: "cast:poetFinalHitCancel",
  snowpartingCharged: "cast:snowpartingCharged",
  snowpartingChargedForgetfulness: "cast:snowpartingChargedForgetfulness",
  snowpartingDual: "cast:snowpartingDual",
  snowpartingDualPrepull: "cast:snowpartingDualPrepull",
  snowpartingQStab: "cast:snowpartingQStab",
  snowpartingSlide: "cast:snowpartingSlide",
  snowpartingSlidePrepull: "cast:snowpartingSlidePrepull",
  snowpartingSlidePrepullHit: "cast:snowpartingSlidePrepullHit",
  snowpartingSpecial: "cast:snowpartingSpecial",
  snowpartingVC: "cast:snowpartingVC",
  snowpartingVCPrepull: "cast:snowpartingVCPrepull",
  soaring: "cast:soaring",
  soaring1Hit: "cast:soaring1Hit",
  spearHeavy: "cast:spearHeavy",
  spearHeavy1Hit: "cast:spearHeavy1Hit",
  spearHeavy1HitPrepull: "cast:spearHeavy1HitPrepull",
  spearQ: "cast:spearQ",
  spearQ5HitCancel: "cast:spearQ5HitCancel",
  spearSpecial: "cast:spearSpecial",
  spearSpecial1HitCancel: "cast:spearSpecial1HitCancel",
  swordChargeStage13Hit: "cast:swordChargeStage13Hit",
  swordChargeStage14Hit: "cast:swordChargeStage14Hit",
  swordChargeStage15Hit: "cast:swordChargeStage15Hit",
  swordMartialQ: "cast:swordMartialQ",
  swordMartialQQ: "cast:swordMartialQQ",
  swordMartialQQ1HitCancel: "cast:swordMartialQQ1HitCancel",
  swordMartialQQ2HitCancel: "cast:swordMartialQQ2HitCancel",
  swordMartialQQQ: "cast:swordMartialQQQ",
  swordRChargeFollowUp: "cast:swordRChargeFollowUp",
  swordRChargeFollowUp1HitCancel: "cast:swordRChargeFollowUp1HitCancel",
  swordSpecial3Hit: "cast:swordSpecial3Hit",
  swordSpecial4Hit: "cast:swordSpecial4Hit",
  toadCancel: "cast:toadCancel",
} as const

export const ROLE = {
  anxiSoldier: "role:anxiSoldier",
  anxiSoldierMoDown: "role:anxiSoldierMoDown",
  anxiSoldierMoJump: "role:anxiSoldierMoJump",
  bleedDetonation: "role:bleedDetonation",
  bleedTick: "role:bleedTick",
  combustion: "role:combustion",
  dragonHead: "role:dragonHead",
  dragonHeadPlus: "role:dragonHeadPlus",
  phalanxCharged: "role:phalanxCharged",
  phalanxQ: "role:phalanxQ",
  snowpartingQStab: "role:snowpartingQStab",
  snowpartingVC: "role:snowpartingVC",
} as const

export const WEAPON = {
  fan: "weapon:Fan",
  hengBlade: "weapon:Heng Blade",
  moBlade: "weapon:Mo Blade",
  ropeDart: "weapon:RopeDart",
  spear: "weapon:Spear",
  stormbreakerSpear: "weapon:Stormbreaker Spear",
  sword: "weapon:Sword",
  umbrella: "weapon:Umbrella",
  none: "weapon:none",
} as const

export const ATTUNE = {
  bleed: "attune:bleed",
  phalanxbaneCharged: "attune:phalanxbaneCharged",
  phalanxbaneQ: "attune:phalanxbaneQ",
  snowpartingCharged: "attune:snowpartingCharged",
  snowpartingQ: "attune:snowpartingQ",
  snowpartingVariedCombo: "attune:snowpartingVariedCombo",
  spearCharged: "attune:spearCharged",
  spearQ: "attune:spearQ",
  spearSpecial: "attune:spearSpecial",
  swordCharged: "attune:swordCharged",
  swordQ: "attune:swordQ",
  swordSpecial: "attune:swordSpecial",
} as const

// `context.ts` derives `SkillProperties`'s boolean keys from these values at
// the type level, and `PROP_TO_PROPERTY` there maps every one of them to its
// key — both enforced by the compiler, not by convention.
export const PROP = {
  abrasionImmune: "prop:abrasionImmune",
  consumesInnerPassion: "prop:consumesInnerPassion",
  consumesInnerPassionBurningHeart: "prop:consumesInnerPassionBurningHeart",
  hasLowQiCritBoost: "prop:hasLowQiCritBoost",
  hasLowQiDmgBoost: "prop:hasLowQiDmgBoost",
  hasQiBreakDoubleDamage: "prop:hasQiBreakDoubleDamage",
  hasQiBreakPhysPen: "prop:hasQiBreakPhysPen",
  isCharged: "prop:isCharged",
  isExecution: "prop:isExecution",
  isMartialSkillQ: "prop:isMartialSkillQ",
  shatteredRidgeBoost: "prop:shatteredRidgeBoost",
} as const

export const ATTACK = {
  charge: "attack:charge",
  heavy: "attack:heavy",
  light: "attack:light",
  mixed: "attack:mixed",
} as const

export const MYSTIC = {
  area: "mystic:area",
  areaDamage: "mystic:area-damage",
  areaDebuff: "mystic:area-debuff",
  burst: "mystic:burst",
  control: "mystic:control",
} as const

// `SkillsTab.tsx`'s `INNER_WAY_DOT_TAG` — the only tag under this prefix.
export const SOURCE = {
  innerWayDot: "source:innerWayDot",
} as const

export type CastTag = (typeof CAST)[keyof typeof CAST]
export type RoleTag = (typeof ROLE)[keyof typeof ROLE]
export type WeaponTag = (typeof WEAPON)[keyof typeof WEAPON]
export type AttuneTag = (typeof ATTUNE)[keyof typeof ATTUNE]
export type PropTag = (typeof PROP)[keyof typeof PROP]
export type AttackTag = (typeof ATTACK)[keyof typeof ATTACK]
export type MysticTag = (typeof MYSTIC)[keyof typeof MYSTIC]
export type SourceTag = (typeof SOURCE)[keyof typeof SOURCE]
