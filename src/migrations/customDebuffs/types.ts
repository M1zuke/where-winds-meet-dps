import type { ChainRunResult, ChainStep } from "../chain"

export interface RawCustomDebuffsBlob {
  v: number
  debuffs: unknown[]
  [key: string]: unknown
}

export type CustomDebuffMigration = ChainStep<RawCustomDebuffsBlob>
export type CustomDebuffMigrationRunResult = ChainRunResult<RawCustomDebuffsBlob>
