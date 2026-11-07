// v11 → v12 — the Bitter Season tick re-arms its own timer, so it gained
// `reschedulesPerTick: true`. A Skill Editor copy seeded before that carries no
// flag and keeps an exact one-second interval. Only a copy still holding the
// interval it was seeded with is rewritten: once the interval differs, a stale
// copy and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const BITTER_SEASON_ID_SUFFIX = "-bitter-season-tick"
const SEEDED_INTERVAL_FRAMES = 60

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healBitterSeasonCadence(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  if (!debuff.id.endsWith(BITTER_SEASON_ID_SUFFIX)) return debuff
  const dot = debuff.dot
  if (!isRecord(dot)) return debuff
  if (dot.tickIntervalFrames !== SEEDED_INTERVAL_FRAMES) return debuff
  if ("reschedulesPerTick" in dot) return debuff
  return { ...debuff, dot: { ...dot, reschedulesPerTick: true } }
}

export const V12__bitterSeasonCadence: CustomDebuffMigration = {
  to: 12,
  name: "V12__bitterSeasonCadence",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healBitterSeasonCadence)
      : blob.debuffs
    return { ...blob, v: 12, debuffs }
  },
}
