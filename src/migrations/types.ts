export interface RawProfilesBlob {
  v: number
  profiles: unknown[]
  activeId?: unknown
  [key: string]: unknown
}

export interface Migration {
  /** Version this step produces; it runs against a blob at `to - 1`. */
  readonly to: number
  readonly name: string
  migrate(blob: RawProfilesBlob): RawProfilesBlob
}

export interface MigrationRunResult {
  blob: RawProfilesBlob
  applied: string[]
  notes: string[]
}
