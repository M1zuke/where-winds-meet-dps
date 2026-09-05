import type { Migration, MigrationRunResult, RawProfilesBlob } from "./types"
import { latestVersion, runChain } from "./chain"
import { V5__englishIdsWithoutSitePrefix } from "./V5__englishIdsWithoutSitePrefix"
import { V6__dropDerivedStats } from "./V6__dropDerivedStats"
import { V7__clampSingleMysticWordRoll } from "./V7__clampSingleMysticWordRoll"
import { V8__dropRemovedArmorSets } from "./V8__dropRemovedArmorSets"
import { V9__renameSteadfastDevotion } from "./V9__renameSteadfastDevotion"
import { V10__renameFrostCladNight } from "./V10__renameFrostCladNight"
import { V11__setIdsWithoutDisplayName } from "./V11__setIdsWithoutDisplayName"
import { V12__gearWordIds } from "./V12__gearWordIds"
import { V13__gearWordCurrentLabels } from "./V13__gearWordCurrentLabels"
import { V14__dropUnimplementedArmorSets } from "./V14__dropUnimplementedArmorSets"
import { V15__dropSwallowcallSet } from "./V15__dropSwallowcallSet"
import { V16__mergeVernalUmbrellaAttunements } from "./V16__mergeVernalUmbrellaAttunements"
import { V17__renameCleftpeak } from "./V17__renameCleftpeak"
import { V18__followNewUmbraDefaultRotation } from "./V18__followNewUmbraDefaultRotation"
import { V19__qiBreakOverride } from "./V19__qiBreakOverride"
import { V20__mergeRiverFlowIntoWolfchasersArt } from "./V20__mergeRiverFlowIntoWolfchasersArt"
import { V21__formlessAttackWordIds } from "./V21__formlessAttackWordIds"
import { V22__mysticArtIds } from "./V22__mysticArtIds"

export type { Migration, MigrationRunResult, RawProfilesBlob } from "./types"
export {
  migrateClassId,
  migrateEntityId,
  LEGACY_CLASS_IDS,
} from "./V5__englishIdsWithoutSitePrefix"
export { migrateSetId } from "./V11__setIdsWithoutDisplayName"
export { migrateGearWordId } from "./V12__gearWordIds"
export { migrateCurrentGearWordLabel } from "./V13__gearWordCurrentLabels"
export { migrateAttunementId, migrateAttuneTag } from "./V16__mergeVernalUmbrellaAttunements"
export {
  migrateCleftpeakBuffId,
  migrateCleftpeakSetId,
  migrateCleftpeakTag,
} from "./V17__renameCleftpeak"
export { dropRetiredRotationId } from "./V18__followNewUmbraDefaultRotation"
export { qiBreakOverrideFrom, readQiBreakWindow, rotationWindowOf } from "./V19__qiBreakOverride"
export { migrateRiverFlowBuffId } from "./V20__mergeRiverFlowIntoWolfchasersArt"
export { migrateFormlessWordId } from "./V21__formlessAttackWordIds"
export { migrateMysticId, migrateRotationMysticIds } from "./V22__mysticArtIds"

export const PROFILE_MIGRATIONS: readonly Migration[] = [
  V5__englishIdsWithoutSitePrefix,
  V6__dropDerivedStats,
  V7__clampSingleMysticWordRoll,
  V8__dropRemovedArmorSets,
  V9__renameSteadfastDevotion,
  V10__renameFrostCladNight,
  V11__setIdsWithoutDisplayName,
  V12__gearWordIds,
  V13__gearWordCurrentLabels,
  V14__dropUnimplementedArmorSets,
  V15__dropSwallowcallSet,
  V16__mergeVernalUmbrellaAttunements,
  V17__renameCleftpeak,
  V18__followNewUmbraDefaultRotation,
  V19__qiBreakOverride,
  V20__mergeRiverFlowIntoWolfchasersArt,
  V21__formlessAttackWordIds,
  V22__mysticArtIds,
]

const VERSION_BEFORE_THIS_FOLDER = 4

export const LATEST_PROFILES_VERSION = latestVersion(PROFILE_MIGRATIONS, VERSION_BEFORE_THIS_FOLDER)

export function runProfileMigrations(
  input: unknown,
  options?: { toVersion?: number },
): MigrationRunResult | null {
  return runChain<RawProfilesBlob>(PROFILE_MIGRATIONS, LATEST_PROFILES_VERSION, input, options)
}
