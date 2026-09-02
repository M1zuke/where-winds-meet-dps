// v18 → v19 — the Qi break window moved onto the rotation, and what stays on
// the profile is an override that is off by default.
//
// The previous shape was `combatSettings.qiBreak = { enabled, startSec,
// durationSec, lowQiLeadSec }`, and it always won. Three stored states have to
// land in three different places:
//
// A profile holding the old default was never touched by its owner, so it
// becomes no override at all and the rotation takes over — its result cannot
// move, because a rotation with no window of its own runs that same default.
//
// `enabled: false` asked for no break. It never fully delivered one: the flag
// gated two damage bonuses while the exhausted phase, the timeline band and
// every mechanic reading the phase carried on regardless. A zero-length window
// is the same request honoured everywhere, so this hop moves the number the
// old flag should have moved.
//
// Any other combination was typed in deliberately and must keep scoring the
// same, so it carries over as an active override unchanged.
import type { Migration, RawProfilesBlob } from "./types"

interface QiBreakWindowBlob {
  startSec: number
  durationSec: number
  lowQiLeadSec: number
}

const PREVIOUS_DEFAULT: QiBreakWindowBlob = { startSec: 25, durationSec: 10, lowQiLeadSec: 5 }

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const secondsOr = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback

export function readQiBreakWindow(stored: unknown): QiBreakWindowBlob | null {
  if (!isRec(stored)) return null
  return {
    startSec: secondsOr(stored.startSec, PREVIOUS_DEFAULT.startSec),
    durationSec: secondsOr(stored.durationSec, PREVIOUS_DEFAULT.durationSec),
    lowQiLeadSec: secondsOr(stored.lowQiLeadSec, PREVIOUS_DEFAULT.lowQiLeadSec),
  }
}

function isPreviousDefault(window: QiBreakWindowBlob): boolean {
  return (
    window.startSec === PREVIOUS_DEFAULT.startSec &&
    window.durationSec === PREVIOUS_DEFAULT.durationSec &&
    window.lowQiLeadSec === PREVIOUS_DEFAULT.lowQiLeadSec
  )
}

export function qiBreakOverrideFrom(combatSettings: unknown): QiBreakWindowBlob | null {
  if (!isRec(combatSettings)) return null
  if ("qiBreakOverride" in combatSettings) return readQiBreakWindow(combatSettings.qiBreakOverride)

  const legacy = combatSettings.qiBreak
  if (!isRec(legacy)) return null
  const window = readQiBreakWindow(legacy)!
  if (legacy.enabled === false) return { ...window, durationSec: 0 }
  return isPreviousDefault(window) ? null : window
}

export const V19__qiBreakOverride: Migration = {
  to: 19,
  name: "V19__qiBreakOverride",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          const combatSettings = profile.inputs.combatSettings
          if (!isRec(combatSettings)) return profile
          const { qiBreak: _dropped, ...rest } = combatSettings
          return {
            ...profile,
            inputs: {
              ...profile.inputs,
              combatSettings: { ...rest, qiBreakOverride: qiBreakOverrideFrom(combatSettings) },
            },
          }
        })
      : blob.profiles
    return { ...blob, v: 19, profiles }
  },
}
