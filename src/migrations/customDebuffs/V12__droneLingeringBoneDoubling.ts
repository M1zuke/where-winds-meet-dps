// v11 → v12 — the floating umbrella's fixed hit-count drone variants now
// fire one extra bullet at +9 f whenever the target carries the caster's own
// Lingering Bone, the same behaviour the resource-gated drone already had. A
// Skill Editor copy seeded before this still has no `additionalTicks` at
// all. Only a copy still holding the coefficient shape it was seeded with is
// rewritten: once a value differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const DRONE_HIT_COUNT_IDS = new Set([
  "debuff-silkbindJade-umbdrone-12hit",
  "debuff-silkbindJade-umbdrone-16hit",
  "debuff-silkbindJade-umbdrone-20hit",
  "debuff-silkbindJade-umbdrone-23hit",
  "debuff-silkbindJade-umbdrone-26hit",
])

const SEEDED_COEFFICIENTS = {
  physMultiplier: 0.510829,
  physFixed: 141.375,
  attributeMultiplier: 0.766243,
  attributeFixed: 77,
}

const ADDITIONAL_TICKS = { offsetsFrames: [9], requiresBuff: "lingeringBone" }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function coefficientsMatch(dot: Record<string, unknown>): boolean {
  return (
    dot.physMultiplier === SEEDED_COEFFICIENTS.physMultiplier &&
    dot.physFixed === SEEDED_COEFFICIENTS.physFixed &&
    dot.attributeMultiplier === SEEDED_COEFFICIENTS.attributeMultiplier &&
    dot.attributeFixed === SEEDED_COEFFICIENTS.attributeFixed
  )
}

export function healDroneLingeringBoneDoubling(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  if (!DRONE_HIT_COUNT_IDS.has(debuff.id)) return debuff
  const dot = debuff.dot
  if (!isRecord(dot) || dot.additionalTicks !== undefined) return debuff
  if (!coefficientsMatch(dot)) return debuff
  return { ...debuff, dot: { ...dot, additionalTicks: ADDITIONAL_TICKS } }
}

export const V12__droneLingeringBoneDoubling: CustomDebuffMigration = {
  to: 12,
  name: "V12__droneLingeringBoneDoubling",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healDroneLingeringBoneDoubling)
      : blob.debuffs
    return { ...blob, v: 12, debuffs }
  },
}
