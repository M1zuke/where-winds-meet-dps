// v6 → v7 — a DoT's tick cadence gained two fields: where its first tick lands,
// and whether each tick schedules the next one and so drags the interval long.
// A Skill Editor copy seeded before that carries neither and keeps ticking on
// the old even grid. Only a copy still holding the shape it was seeded with is
// rewritten: once the interval or the coefficients differ, a stale copy and a
// deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

interface Cadence {
  tickIntervalFrames: number
  firstTickOffsetFrames?: number
  reschedulesPerTick: boolean
}

const CADENCE: Record<string, Cadence> = {
  "debuff-bellstrikeUmbra-dark-fire": {
    tickIntervalFrames: 30,
    firstTickOffsetFrames: 0,
    reschedulesPerTick: true,
  },
  "debuff-bellstrikeUmbra-combustion": {
    tickIntervalFrames: 30,
    firstTickOffsetFrames: 0,
    reschedulesPerTick: true,
  },
  "debuff-bellstrikeUmbra-bleed-tick": {
    tickIntervalFrames: 60,
    firstTickOffsetFrames: 30,
    reschedulesPerTick: true,
  },
  "debuff-bellstrikeUmbra-flute-ripple": {
    tickIntervalFrames: 150,
    reschedulesPerTick: false,
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healDotTickCadence(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  const cadence = CADENCE[debuff.id]
  if (!cadence) return debuff
  const dot = debuff.dot
  if (!isRecord(dot)) return debuff
  if (dot.tickIntervalFrames !== cadence.tickIntervalFrames) return debuff
  if ("reschedulesPerTick" in dot) return debuff
  const healed: Record<string, unknown> = { ...dot, reschedulesPerTick: cadence.reschedulesPerTick }
  if (cadence.firstTickOffsetFrames !== undefined) {
    healed.firstTickOffsetFrames = cadence.firstTickOffsetFrames
  }
  return { ...debuff, dot: healed }
}

export const V7__dotTickCadence: CustomDebuffMigration = {
  to: 7,
  name: "V7__dotTickCadence",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healDotTickCadence)
      : blob.debuffs
    return { ...blob, v: 7, debuffs }
  },
}
