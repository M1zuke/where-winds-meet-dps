import type { ChainRunResult, ChainStep } from "../chain"

export interface RawCustomSkillsBlob {
  v: number
  skills: unknown[]
  [key: string]: unknown
}

export type CustomSkillMigration = ChainStep<RawCustomSkillsBlob>
export type CustomSkillMigrationRunResult = ChainRunResult<RawCustomSkillsBlob>
