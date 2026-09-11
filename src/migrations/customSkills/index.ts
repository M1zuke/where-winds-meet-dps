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
