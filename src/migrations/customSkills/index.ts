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

export type {
  CustomSkillMigration,
  CustomSkillMigrationRunResult,
  RawCustomSkillsBlob,
} from "./types"
export { migrateDragonHeadHits } from "./V4__dragonHeadCoefficients"
export { umbraHitSwapsFor } from "./V5__umbraHitCoefficients"
export { healBleedRowDefaults } from "./V6__bleedRowDefaults"
export { healMysticArtRank } from "./V7__mysticArtRankRepair"

export const CUSTOM_SKILL_MIGRATIONS: readonly CustomSkillMigration[] = [
  V4__dragonHeadCoefficients,
  V5__umbraHitCoefficients,
  V6__bleedRowDefaults,
  V7__mysticArtRankRepair,
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
