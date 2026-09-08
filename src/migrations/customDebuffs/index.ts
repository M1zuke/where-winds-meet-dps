import { latestVersion, runChain } from "../chain"
import type {
  CustomDebuffMigration,
  CustomDebuffMigrationRunResult,
  RawCustomDebuffsBlob,
} from "./types"
import { V3__umbraBleedTick } from "./V3__umbraBleedTick"

export type {
  CustomDebuffMigration,
  CustomDebuffMigrationRunResult,
  RawCustomDebuffsBlob,
} from "./types"
export { migrateUmbraBleedDot } from "./V3__umbraBleedTick"

export const CUSTOM_DEBUFF_MIGRATIONS: readonly CustomDebuffMigration[] = [V3__umbraBleedTick]

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
