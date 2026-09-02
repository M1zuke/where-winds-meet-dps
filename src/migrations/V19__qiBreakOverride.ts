// v18 → v19 — the Qi break window moved onto the rotation, and what stays on
// the profile is an override that is off by default.
//
// The previous shape was `combatSettings.qiBreak = { enabled, startSec,
// durationSec, lowQiLeadSec }`, and it always won. Three stored states have to
// land in three different places:
//
// A profile holding the old default was never touched by its owner, so it
// becomes no override at all and the rotation takes over.
//
// `enabled: false` asked for no break. It never fully delivered one: the flag
// gated two damage bonuses while the exhausted phase, the timeline band and
// every mechanic reading the phase carried on regardless. A zero-length window
// is the same request honoured everywhere, so this hop moves the number the
// old flag should have moved.
//
// Any other combination was typed in deliberately and must keep scoring the
// same, so it carries over as an active override unchanged.
//
// "Untouched" means EITHER of two windows, and both are needed. The old app
// default is what a profile holds that was never edited at all. The window the
// profile's own rotation now runs is what a profile holds that was tuned to
// match the encounter its rotation was recorded against — measured against the
// constant alone, every one of those lands with an override switched on, which
// is the state this change set out to retire, and a built-in rotation's window
// is read-only so they could never get out of it.
//
// A profile on the old default does move, because its rotation now declares a
// real window where it used to fall back to that constant. That is the point of
// authoring the windows, and the baseline is re-recorded in the same commit.
//
// The rotation windows below are frozen rather than read from the live pool,
// for the reason V14, V15 and V18 froze their ids: re-authoring a built-in's
// window later must take its own hop instead of retroactively changing what
// this one decided.
import type { Migration, RawProfilesBlob } from "./types"

interface QiBreakWindowBlob {
  startSec: number
  durationSec: number
  lowQiLeadSec: number
}

const PREVIOUS_DEFAULT: QiBreakWindowBlob = { startSec: 25, durationSec: 10, lowQiLeadSec: 5 }

const BUILTIN_ROTATION_WINDOWS: Readonly<Record<string, QiBreakWindowBlob>> = {
  "builtin-bellstrikeUmbra-36-bbs": { startSec: 34, durationSec: 10, lowQiLeadSec: 5 },
  "builtin-bellstrikeUmbra-38-bbs": { startSec: 34, durationSec: 10, lowQiLeadSec: 5 },
  "builtin-bellstrikeUmbra-nox-1m-dh": { startSec: 35, durationSec: 10, lowQiLeadSec: 5 },
  "builtin-bellstrikeUmbra-nox-30s-dh": { startSec: 34, durationSec: 10, lowQiLeadSec: 5 },
  "builtin-stonesplitStrength-tilla-dummy-rotation": {
    startSec: 29,
    durationSec: 10,
    lowQiLeadSec: 5,
  },
  "builtin-stonesplitStrength-windsfromcn-switch": {
    startSec: 29,
    durationSec: 10,
    lowQiLeadSec: 5,
  },
  "builtin-stonesplitStrength-windsfromcn-switch-no-toad": {
    startSec: 29,
    durationSec: 10,
    lowQiLeadSec: 5,
  },
  "builtin-bellstrikeSplendor-kaezuma-42vs-1db": { startSec: 34, durationSec: 10, lowQiLeadSec: 5 },
  "builtin-bellstrikeSplendor-crylis-44vs-full-waves": {
    startSec: 34,
    durationSec: 10,
    lowQiLeadSec: 5,
  },
  "builtin-bellstrikeSplendor-60s-78-waves-2-flute-1-frog": {
    startSec: 34,
    durationSec: 10,
    lowQiLeadSec: 5,
  },
  "builtin-silkbindJade-t5": { startSec: 34, durationSec: 10, lowQiLeadSec: 5 },
  "builtin-silkbindJade-standardized-1-7": { startSec: 34, durationSec: 10, lowQiLeadSec: 5 },
}

const DEFAULT_ROTATION_ID_BY_CLASS: Readonly<Record<string, string>> = {
  bellstrikeUmbra: "builtin-bellstrikeUmbra-38-bbs",
  bellstrikeSplendor: "builtin-bellstrikeSplendor-kaezuma-42vs-1db",
  silkbindJade: "builtin-silkbindJade-standardized-1-7",
  stonesplitStrength: "builtin-stonesplitStrength-tilla-dummy-rotation",
}

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

function sameWindow(left: QiBreakWindowBlob, right: QiBreakWindowBlob): boolean {
  return (
    left.startSec === right.startSec &&
    left.durationSec === right.durationSec &&
    left.lowQiLeadSec === right.lowQiLeadSec
  )
}

// What the profile's rotation runs on its own, which is what a stored window is
// judged against. A custom rotation carries none at this version, so in practice
// only the built-in table and the class default decide it.
export function rotationWindowOf(inputs: unknown): QiBreakWindowBlob {
  if (!isRec(inputs)) return PREVIOUS_DEFAULT
  const custom = inputs.activeCustomRotation
  if (isRec(custom)) return readQiBreakWindow(custom.qiBreak) ?? PREVIOUS_DEFAULT
  const selected = inputs.selectedBuiltinRotationId
  const rotationId =
    typeof selected === "string" && selected
      ? selected
      : typeof inputs.classId === "string"
        ? DEFAULT_ROTATION_ID_BY_CLASS[inputs.classId]
        : undefined
  return (rotationId && BUILTIN_ROTATION_WINDOWS[rotationId]) || PREVIOUS_DEFAULT
}

export function qiBreakOverrideFrom(
  combatSettings: unknown,
  rotationWindow: QiBreakWindowBlob = PREVIOUS_DEFAULT,
): QiBreakWindowBlob | null {
  if (!isRec(combatSettings)) return null
  if ("qiBreakOverride" in combatSettings) return readQiBreakWindow(combatSettings.qiBreakOverride)

  const legacy = combatSettings.qiBreak
  if (!isRec(legacy)) return null
  const window = readQiBreakWindow(legacy)!
  if (legacy.enabled === false) return { ...window, durationSec: 0 }
  const untouched = sameWindow(window, PREVIOUS_DEFAULT) || sameWindow(window, rotationWindow)
  return untouched ? null : window
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
              combatSettings: {
                ...rest,
                qiBreakOverride: qiBreakOverrideFrom(
                  combatSettings,
                  rotationWindowOf(profile.inputs),
                ),
              },
            },
          }
        })
      : blob.profiles
    return { ...blob, v: 19, profiles }
  },
}
