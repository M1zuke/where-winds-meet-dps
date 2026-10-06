import { latestVersion, runChain } from "../chain"
import type {
  CustomSkillMigration,
  CustomSkillMigrationRunResult,
  RawCustomSkillsBlob,
} from "./types"
import { V4__dragonHeadCoefficients } from "./V4__dragonHeadCoefficients"
import { V5__umbraHitCoefficients } from "./V5__umbraHitCoefficients"
import { V6__bleedRowDefaults } from "./V6__bleedRowDefaults"
import { V7__mysticArtRankRepair } from "./V7__mysticArtRankRepair"
import { V8__riverFlowAppliesOnCastEnd } from "./V8__riverFlowAppliesOnCastEnd"
import { V9__bleedCoefficientReach } from "./V9__bleedCoefficientReach"
import { V10__wolfchasersArtSwordOverreach } from "./V10__wolfchasersArtSwordOverreach"
import { V11__spearMistwillowReach } from "./V11__spearMistwillowReach"
import { V12__dragonHeadLowHpReach } from "./V12__dragonHeadLowHpReach"
import { V13__spearHeavyChargedCoefficients } from "./V13__spearHeavyChargedCoefficients"
import { V14__mysticArtIds } from "./V14__mysticArtIds"
import { V15__neverAbrades } from "./V15__neverAbrades"
import { V16__bellstrikeUmbraArtBonusAttack } from "./V16__bellstrikeUmbraArtBonusAttack"
import { V17__bellstrikeSplendorArtBonusAttack } from "./V17__bellstrikeSplendorArtBonusAttack"
import { V18__stonesplitStrengthArtBonusAttack } from "./V18__stonesplitStrengthArtBonusAttack"
import { V19__bamboocutDraughtArtBonusAttack } from "./V19__bamboocutDraughtArtBonusAttack"
import { V20__silkbindJadeArtBonusAttack } from "./V20__silkbindJadeArtBonusAttack"
import { V21__jadeBlossomBarrageReach } from "./V21__jadeBlossomBarrageReach"
import { V22__sharedMysticCoefficients } from "./V22__sharedMysticCoefficients"
import { V23__drunkenHazeExplosion } from "./V23__drunkenHazeExplosion"
import { V24__umbraValueFixes } from "./V24__umbraValueFixes"
import { V25__bamboocutDraughtValuesGatesReach } from "./V25__bamboocutDraughtValuesGatesReach"
import { V26__stonesplitStrengthValuesGatesReach } from "./V26__stonesplitStrengthValuesGatesReach"
import { V27__bellstrikeSplendorValuesGatesReach } from "./V27__bellstrikeSplendorValuesGatesReach"
import { V28__silkbindJadeValuesGatesReach } from "./V28__silkbindJadeValuesGatesReach"
import { V29__soberSorrowExtendUsesParam } from "./V29__soberSorrowExtendUsesParam"
import { V30__swordSpecial4HitAttunementReach } from "./V30__swordSpecial4HitAttunementReach"
import { V31__forgetfulnessCooldownMarker } from "./V31__forgetfulnessCooldownMarker"
import { V32__snowbreakSpringAvailability } from "./V32__snowbreakSpringAvailability"
import { V33__snowbreakSpringGrantTiming } from "./V33__snowbreakSpringGrantTiming"
import { V34__herosBloodInebriateConditionalNoAbrasion } from "./V34__herosBloodInebriateConditionalNoAbrasion"
import { V35__swordHorizonCrisscrossGates } from "./V35__swordHorizonCrisscrossGates"
import { V36__swordMorphMultiWaveWindow } from "./V36__swordMorphMultiWaveWindow"
import { V37__anxiSoldierHengSnowbreakTag } from "./V37__anxiSoldierHengSnowbreakTag"
import { V38__meterFieldsAndGains } from "./V38__meterFieldsAndGains"
import { V39__meterModifierGains } from "./V39__meterModifierGains"
import { V40__mountainsMightAndQiImbalanceMarker } from "./V40__mountainsMightAndQiImbalanceMarker"
import { V41__wolfchasersArtSweepAllEnduranceGain } from "./V41__wolfchasersArtSweepAllEnduranceGain"
import { V42__calmwatersPerfectDodgeGain } from "./V42__calmwatersPerfectDodgeGain"
import { V43__evasiveChargeDodgeRefund } from "./V43__evasiveChargeDodgeRefund"
import { V44__targetDistanceReachAndDisplacement } from "./V44__targetDistanceReachAndDisplacement"
import { V45__castLengthAndHitFrameRepairs } from "./V45__castLengthAndHitFrameRepairs"
import { V46__stonesplitSplendorJadeTimingRepairs } from "./V46__stonesplitSplendorJadeTimingRepairs"
import { V47__weaponDrawnGates } from "./V47__weaponDrawnGates"
import { V48__qiRateDefaults } from "./V48__qiRateDefaults"
import { V49__perGrantSiteDelayAndSetReach } from "./V49__perGrantSiteDelayAndSetReach"
import { V50__etherwrathPenetrationReach } from "./V50__etherwrathPenetrationReach"
import { V51__relentlessChaseSecondStrike } from "./V51__relentlessChaseSecondStrike"
import { V52__gourdTossThunder } from "./V52__gourdTossThunder"
import { V53__gourdTossFlyingTornado } from "./V53__gourdTossFlyingTornado"
import { V54__swallowcallColorfulPhoenixReach } from "./V54__swallowcallColorfulPhoenixReach"
import { V55__ghostlyStepsEnduranceCostReduction } from "./V55__ghostlyStepsEnduranceCostReduction"
import { V56__poetSecondCollider } from "./V56__poetSecondCollider"
import { V57__nightwickFollowUpCancelledByNextSkill } from "./V57__nightwickFollowUpCancelledByNextSkill"
import { V58__inGameCoefficientCorrections } from "./V58__inGameCoefficientCorrections"
import { V59__removeNightwickTipsylayHybrid } from "./V59__removeNightwickTipsylayHybrid"
import { V60__springlessSilenceLandingHitOnly } from "./V60__springlessSilenceLandingHitOnly"
import { V61__boundvesselSpringAwayToadAfterimageTiming } from "./V61__boundvesselSpringAwayToadAfterimageTiming"
import { V62__shadowStepDashWindow } from "./V62__shadowStepDashWindow"

export type {
  CustomSkillMigration,
  CustomSkillMigrationRunResult,
  RawCustomSkillsBlob,
} from "./types"
export { migrateDragonHeadHits } from "./V4__dragonHeadCoefficients"
export { umbraHitSwapsFor } from "./V5__umbraHitCoefficients"
export { healBleedRowDefaults } from "./V6__bleedRowDefaults"
export { healMysticArtRank } from "./V7__mysticArtRankRepair"
export { healRiverFlowApplication } from "./V8__riverFlowAppliesOnCastEnd"
export { healBleedCoefficientReach } from "./V9__bleedCoefficientReach"
export { healWolfchasersArtSwordOverreach } from "./V10__wolfchasersArtSwordOverreach"
export { healSpearMistwillowReach } from "./V11__spearMistwillowReach"
export { healDragonHeadLowHpReach } from "./V12__dragonHeadLowHpReach"
export {
  healSpearHeavyChargedCoefficients,
  spearHeavyHitSwapsFor,
} from "./V13__spearHeavyChargedCoefficients"
export { migrateMysticSkillHit } from "./V14__mysticArtIds"
export { migrateNeverAbradesSkill } from "./V15__neverAbrades"
export { healBellstrikeUmbraArtBonusAttack } from "./V16__bellstrikeUmbraArtBonusAttack"
export { healBellstrikeSplendorArtBonusAttack } from "./V17__bellstrikeSplendorArtBonusAttack"
export { healStonesplitStrengthArtBonusAttack } from "./V18__stonesplitStrengthArtBonusAttack"
export { healBamboocutDraughtArtBonusAttack } from "./V19__bamboocutDraughtArtBonusAttack"
export { healSilkbindJadeArtBonusAttack } from "./V20__silkbindJadeArtBonusAttack"
export { recalibrateSharedMysticHits } from "./V22__sharedMysticCoefficients"
export {
  addDrunkenHazeExplosionHits,
  addFinalStrikeExplosionTrigger,
} from "./V23__drunkenHazeExplosion"
export {
  healSpearqRiverFlowTiers,
  healSpearq5HitCancelRiverFlowTiers,
  healSweepAllHits,
  healBleedDetonationHits,
  healSpearheavyHits,
  healSpearheavyCastFrames,
  healSpearheavyStage2Tags,
  healCrosswindBladeTags,
  healHeavyAttackTag,
} from "./V24__umbraValueFixes"
export { healBamboocutDraughtValuesGatesReach } from "./V25__bamboocutDraughtValuesGatesReach"
export { healStonesplitStrengthValuesGatesReach } from "./V26__stonesplitStrengthValuesGatesReach"
export { healBellstrikeSplendorValuesGatesReach } from "./V27__bellstrikeSplendorValuesGatesReach"
export { healSilkbindJadeValuesGatesReach } from "./V28__silkbindJadeValuesGatesReach"
export {
  healSpearqExtendParam,
  healSpearq5HitCancelExtendParam,
} from "./V29__soberSorrowExtendUsesParam"
export { healSwordspecial4HitAttunementReach } from "./V30__swordSpecial4HitAttunementReach"
export { healSkill as healForgetfulnessCooldownMarker } from "./V31__forgetfulnessCooldownMarker"
export { healSkill as healSnowbreakSpringAvailability } from "./V32__snowbreakSpringAvailability"
export { healSkill as healSnowbreakSpringGrantTiming } from "./V33__snowbreakSpringGrantTiming"
export { healSkill as healHerosBloodInebriateConditionalNoAbrasion } from "./V34__herosBloodInebriateConditionalNoAbrasion"
export { healSkill as healSwordHorizonCrisscrossGates } from "./V35__swordHorizonCrisscrossGates"
export { healSkill as healSwordMorphMultiWaveWindow } from "./V36__swordMorphMultiWaveWindow"
export { healSkill as healAnxiSoldierHengSnowbreakTag } from "./V37__anxiSoldierHengSnowbreakTag"
export { healSkill as healMeterModifierGains } from "./V39__meterModifierGains"
export { healSkill as healMountainsMightAndQiImbalanceMarker } from "./V40__mountainsMightAndQiImbalanceMarker"
export { healSkill as healWolfchasersArtSweepAllEnduranceGain } from "./V41__wolfchasersArtSweepAllEnduranceGain"
export { healSkill as healCalmwatersPerfectDodgeGain } from "./V42__calmwatersPerfectDodgeGain"
export { healSkill as healEvasiveChargeDodgeRefund } from "./V43__evasiveChargeDodgeRefund"
export { healSkill as healTargetDistanceReachAndDisplacement } from "./V44__targetDistanceReachAndDisplacement"
export { healSkillFrames as healCastLengthAndHitFrameRepairs } from "./V45__castLengthAndHitFrameRepairs"
export { healSkillFrames as healStonesplitSplendorJadeTimingRepairs } from "./V46__stonesplitSplendorJadeTimingRepairs"
export { healSkill as healWeaponDrawnGates } from "./V47__weaponDrawnGates"
export { healQiRateDefault } from "./V48__qiRateDefaults"
export { healSkill as healPoetSecondCollider } from "./V56__poetSecondCollider"
export { healSkill as healNightwickFollowUpCancelledByNextSkill } from "./V57__nightwickFollowUpCancelledByNextSkill"

export const CUSTOM_SKILL_MIGRATIONS: readonly CustomSkillMigration[] = [
  V4__dragonHeadCoefficients,
  V5__umbraHitCoefficients,
  V6__bleedRowDefaults,
  V7__mysticArtRankRepair,
  V8__riverFlowAppliesOnCastEnd,
  V9__bleedCoefficientReach,
  V10__wolfchasersArtSwordOverreach,
  V11__spearMistwillowReach,
  V12__dragonHeadLowHpReach,
  V13__spearHeavyChargedCoefficients,
  V14__mysticArtIds,
  V15__neverAbrades,
  V16__bellstrikeUmbraArtBonusAttack,
  V17__bellstrikeSplendorArtBonusAttack,
  V18__stonesplitStrengthArtBonusAttack,
  V19__bamboocutDraughtArtBonusAttack,
  V20__silkbindJadeArtBonusAttack,
  V21__jadeBlossomBarrageReach,
  V22__sharedMysticCoefficients,
  V23__drunkenHazeExplosion,
  V24__umbraValueFixes,
  V25__bamboocutDraughtValuesGatesReach,
  V26__stonesplitStrengthValuesGatesReach,
  V27__bellstrikeSplendorValuesGatesReach,
  V28__silkbindJadeValuesGatesReach,
  V29__soberSorrowExtendUsesParam,
  V30__swordSpecial4HitAttunementReach,
  V31__forgetfulnessCooldownMarker,
  V32__snowbreakSpringAvailability,
  V33__snowbreakSpringGrantTiming,
  V34__herosBloodInebriateConditionalNoAbrasion,
  V35__swordHorizonCrisscrossGates,
  V36__swordMorphMultiWaveWindow,
  V37__anxiSoldierHengSnowbreakTag,
  V38__meterFieldsAndGains,
  V39__meterModifierGains,
  V40__mountainsMightAndQiImbalanceMarker,
  V41__wolfchasersArtSweepAllEnduranceGain,
  V42__calmwatersPerfectDodgeGain,
  V43__evasiveChargeDodgeRefund,
  V44__targetDistanceReachAndDisplacement,
  V45__castLengthAndHitFrameRepairs,
  V46__stonesplitSplendorJadeTimingRepairs,
  V47__weaponDrawnGates,
  V48__qiRateDefaults,
  V49__perGrantSiteDelayAndSetReach,
  V50__etherwrathPenetrationReach,
  V51__relentlessChaseSecondStrike,
  V52__gourdTossThunder,
  V53__gourdTossFlyingTornado,
  V54__swallowcallColorfulPhoenixReach,
  V55__ghostlyStepsEnduranceCostReduction,
  V56__poetSecondCollider,
  V57__nightwickFollowUpCancelledByNextSkill,
  V58__inGameCoefficientCorrections,
  V59__removeNightwickTipsylayHybrid,
  V60__springlessSilenceLandingHitOnly,
  V61__boundvesselSpringAwayToadAfterimageTiming,
  V62__shadowStepDashWindow,
]

// The store's version before it had a chain; older blobs used a shape no step
// reads and are dropped, as they were before.
export const OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION = 3

export const LATEST_CUSTOM_SKILLS_VERSION = latestVersion(
  CUSTOM_SKILL_MIGRATIONS,
  OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION,
)

export function runCustomSkillMigrations(
  input: unknown,
  options?: { toVersion?: number },
): CustomSkillMigrationRunResult | null {
  return runChain<RawCustomSkillsBlob>(
    CUSTOM_SKILL_MIGRATIONS,
    LATEST_CUSTOM_SKILLS_VERSION,
    input,
    options,
  )
}
