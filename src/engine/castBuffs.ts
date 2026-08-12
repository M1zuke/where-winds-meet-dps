// Assembles the one list of statuses a cast shows, out of the two stores that
// track them.
//
// THE TWO STORES ARE NOT MERGEABLE AS THEY STAND, and that is a semantic
// difference rather than a plumbing one:
//
//   StatusLedger.isActiveAt   — active if ANY recorded window covers the frame
//   BuffEngine.isBuffActiveAtTime — active per the LATEST apply at or before
//                                   the time, so a shorter re-apply SHORTENS
//                                   the buff
//
// Apply for 12 s at t=0 and again for 8 s at t=10: the engine calls it expired
// at t=13, the ledger calls it live until t=12. `rainwhisperShield` really
// does this (8 s base duration, extended to 12 s for a Golden Body cancel).
// Writing the engine's applies into the ledger as windows would silently
// extend buffs like it.
//
// So the read surface is unified here and the storage is not. Both keep their
// own rule; this file fixes the ORDER they are presented in — ledger first,
// engine second, engine entries skipped when the ledger already showed that id.
import type { Buff } from "./buff"
import type { Debuff } from "./debuff"
import type { CastBuffTag } from "./types"
import type { BuffEngine } from "./buffs/buffEngine"
import type { StatusLedger } from "./ledger"

export interface CastBuffCollection {
  buffs: CastBuffTag[]
  seen: Set<string>
}

export interface CastBuffQuery {
  frame: number
  timeSec: number
  fps: number
  ledger: StatusLedger
  statusById: ReadonlyMap<string, Buff | Debuff>
  buffEngine: BuffEngine | null
  // A mechanic that computes its own expected uptime replaces the window-based
  // number with one the ledger cannot know. `null` means "not mine"; a box
  // means "mine", and `seconds: undefined` inside it withholds the duration
  // rather than showing a misleading one. Goes away when mechanics gain their
  // own `display`.
  overrideRemainingSec?: (id: string, timeSec: number) => { seconds: number | undefined } | null
}

const hasDot = (status: Buff | Debuff): status is Debuff => "dot" in status

export function collectCastBuffs(query: CastBuffQuery): CastBuffCollection {
  const { frame, timeSec, fps, ledger, statusById, buffEngine } = query
  const buffs: CastBuffTag[] = []
  const seen = new Set<string>()

  for (const id of ledger.activeIdsAt(frame)) {
    const status = statusById.get(id)
    if (!status || seen.has(id)) continue
    seen.add(id)

    const tracked = ledger.stacksAt(id, frame)
    const stacks = tracked > 0 ? tracked : ledger.hasStackHistory(id) ? tracked : 1
    const dotIntervalSec =
      hasDot(status) && status.dot && status.dot.tickIntervalFrames > 0
        ? status.dot.tickIntervalFrames / fps
        : undefined

    let remainingSec: number | undefined
    if (status.activation !== "permanent") {
      const remainingFrames = ledger.remainingFramesAt(id, frame)
      if (remainingFrames !== undefined) remainingSec = remainingFrames / fps
    }
    const overridden = query.overrideRemainingSec?.(id, timeSec)
    if (overridden) remainingSec = overridden.seconds

    buffs.push({
      id,
      name: status.name,
      stacks,
      maxStacks: status.maxStacks ?? 1,
      effects: status.effects,
      dotIntervalSec,
      remainingSec,
    })
  }

  if (buffEngine) {
    for (const engineBuff of buffEngine.activeBuffsForDisplay(timeSec)) {
      if (seen.has(engineBuff.id)) continue
      seen.add(engineBuff.id)
      buffs.push({
        id: engineBuff.id,
        name: engineBuff.name,
        stacks: engineBuff.stacks,
        maxStacks: engineBuff.maxStacks,
        effects: engineBuff.effects,
        requires: engineBuff.requires,
      })
    }
  }

  return { buffs, seen }
}
