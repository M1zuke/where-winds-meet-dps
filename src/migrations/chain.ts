export interface VersionedBlob {
  v: number
  [key: string]: unknown
}

export interface ChainStep<Blob extends VersionedBlob> {
  /** Version this step produces; it runs against a blob at `to - 1`. */
  readonly to: number
  readonly name: string
  migrate(blob: Blob): Blob
}

export interface ChainRunResult<Blob extends VersionedBlob> {
  blob: Blob
  applied: string[]
  notes: string[]
}

export function latestVersion<Blob extends VersionedBlob>(
  steps: readonly ChainStep<Blob>[],
  versionBeforeChain: number,
): number {
  return steps.reduce((max, step) => Math.max(max, step.to), versionBeforeChain)
}

export function runChain<Blob extends VersionedBlob>(
  steps: readonly ChainStep<Blob>[],
  latest: number,
  input: unknown,
  options?: { toVersion?: number },
): ChainRunResult<Blob> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null

  const applied: string[] = []
  const notes: string[] = []
  const source = input as Blob
  const targetVersion = Math.min(options?.toVersion ?? latest, latest)

  const rawVersion = typeof source.v === "number" && Number.isFinite(source.v) ? source.v : 0
  if (rawVersion !== source.v) notes.push(`missing/invalid version, treated as ${rawVersion}`)

  // A downgrade must not shred data a newer build wrote.
  if (rawVersion > targetVersion) {
    notes.push(`blob v${rawVersion} is newer than v${targetVersion} — left untouched`)
    return { blob: source, applied, notes }
  }

  const byTarget = new Map(steps.map((step) => [step.to, step]))
  let blob: Blob = source

  for (let target = rawVersion + 1; target <= targetVersion; target++) {
    const step = byTarget.get(target)
    if (!step) {
      notes.push(`no migration to v${target} — passed through`)
      blob = { ...blob, v: target }
      continue
    }
    try {
      const next = step.migrate(blob)
      if (!next || typeof next !== "object") throw new Error("step returned a non-object")
      blob = { ...next, v: target }
      applied.push(step.name)
    } catch (e) {
      notes.push(`${step.name} failed (${(e as Error)?.message ?? e}) — blob kept unchanged`)
      blob = { ...blob, v: target }
    }
  }

  return { blob, applied, notes }
}
