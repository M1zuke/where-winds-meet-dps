import { latestVersion, runChain } from "../chain"
import type {
  CustomDebuffMigration,
  CustomDebuffMigrationRunResult,
  RawCustomDebuffsBlob,
} from "./types"
import { V3__umbraBleedTick } from "./V3__umbraBleedTick"
import { V4__umbraSmolderTick } from "./V4__umbraSmolderTick"
import { V5__mysticArtRankRepair } from "./V5__mysticArtRankRepair"
import { V6__bleedCoefficientReach } from "./V6__bleedCoefficientReach"
import { V7__dotTickCadence } from "./V7__dotTickCadence"
import { V8__mysticArtIds } from "./V8__mysticArtIds"

export type {
  CustomDebuffMigration,
  CustomDebuffMigrationRunResult,
  RawCustomDebuffsBlob,
} from "./types"
export { migrateUmbraBleedDot } from "./V3__umbraBleedTick"
export { migrateUmbraSmolderDot } from "./V4__umbraSmolderTick"
export { healMysticDotRank } from "./V5__mysticArtRankRepair"
export { healBleedCoefficientReceives } from "./V6__bleedCoefficientReach"
export { healDotTickCadence } from "./V7__dotTickCadence"
export { migrateMysticDebuffReferences } from "./V8__mysticArtIds"

export const CUSTOM_DEBUFF_MIGRATIONS: readonly CustomDebuffMigration[] = [
  V3__umbraBleedTick,
  V4__umbraSmolderTick,
  V5__mysticArtRankRepair,
  V6__bleedCoefficientReach,
  V7__dotTickCadence,
  V8__mysticArtIds,
]

// The store's version before it had a chain; a v1 blob is the mixed buff store
// that `storage.ts` splits on load, and nothing older exists.
export const OLDEST_MIGRATABLE_CUSTOM_DEBUFFS_VERSION = 2

export const LATEST_CUSTOM_DEBUFFS_VERSION = latestVersion(
  CUSTOM_DEBUFF_MIGRATIONS,
  OLDEST_MIGRATABLE_CUSTOM_DEBUFFS_VERSION,
)

export function runCustomDebuffMigrations(
  input: unknown,
  options?: { toVersion?: number },
): CustomDebuffMigrationRunResult | null {
  return runChain<RawCustomDebuffsBlob>(
    CUSTOM_DEBUFF_MIGRATIONS,
    LATEST_CUSTOM_DEBUFFS_VERSION,
    input,
    options,
  )
}
