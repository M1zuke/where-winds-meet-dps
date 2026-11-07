// v9 → v10 — the floating umbrella's drone ticks now run on a 30 f grid with
// its own first-tick offset, replacing the earlier 21 f grid that read the
// first tick as landing with the interval itself. A Skill Editor copy seeded
// before this still carries the old grid. Only a copy still holding the
// shape it was seeded with is rewritten: once the interval or the offset
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

// A fixed tick count, its old duration (`ticks * 21 + 1`) and its new one
// (`33 + (ticks - 1) * 30 + 1`) — the window has to keep fitting exactly this
// many ticks under the corrected offset, never one more or fewer.
const DRONE_WINDOWS: Record<string, { ticks: number; fromDuration: number; toDuration: number }> = {
  "debuff-silkbindJade-umbdrone-12hit": { ticks: 12, fromDuration: 253, toDuration: 364 },
  "debuff-silkbindJade-umbdrone-16hit": { ticks: 16, fromDuration: 337, toDuration: 484 },
  "debuff-silkbindJade-umbdrone-20hit": { ticks: 20, fromDuration: 421, toDuration: 604 },
  "debuff-silkbindJade-umbdrone-23hit": { ticks: 23, fromDuration: 484, toDuration: 694 },
  "debuff-silkbindJade-umbdrone-26hit": { ticks: 26, fromDuration: 547, toDuration: 784 },
}

const OLD_INTERVAL_FRAMES = 21
const NEW_INTERVAL_FRAMES = 30
const NEW_FIRST_TICK_OFFSET_FRAMES = 33

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healDroneIntervalAndOffset(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  const dot = debuff.dot
  if (!isRecord(dot)) return debuff
  if (debuff.id === "debuff-silkbindJade-umbdrone") {
    const isPreFix = dot.tickIntervalFrames === OLD_INTERVAL_FRAMES
    const isProvisionalFix =
      dot.tickIntervalFrames === NEW_INTERVAL_FRAMES && dot.firstTickOffsetFrames === 21
    if (!isPreFix && !isProvisionalFix) return debuff
    return {
      ...debuff,
      dot: {
        ...dot,
        tickIntervalFrames: NEW_INTERVAL_FRAMES,
        firstTickOffsetFrames: NEW_FIRST_TICK_OFFSET_FRAMES,
      },
    }
  }
  const window = DRONE_WINDOWS[debuff.id]
  if (!window) return debuff
  if (dot.tickIntervalFrames !== OLD_INTERVAL_FRAMES) return debuff
  if (debuff.durationFrames !== window.fromDuration) return debuff
  return {
    ...debuff,
    durationFrames: window.toDuration,
    dot: {
      ...dot,
      tickIntervalFrames: NEW_INTERVAL_FRAMES,
      firstTickOffsetFrames: NEW_FIRST_TICK_OFFSET_FRAMES,
    },
  }
}

export const V10__droneIntervalAndOffset: CustomDebuffMigration = {
  to: 10,
  name: "V10__droneIntervalAndOffset",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healDroneIntervalAndOffset)
      : blob.debuffs
    return { ...blob, v: 10, debuffs }
  },
}
