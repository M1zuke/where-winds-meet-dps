// v23 → v24 — gear enhancement moves from a freely dialled value per stat to
// one level per slot; a level's stats are the cumulative ladder row it grants.
// Each old node's value maps to the highest level whose row does not exceed
// it, taking the higher of a slot's two old nodes (weapons stored min and
// max) and defaulting the four armour slots, which the old model never
// tracked at all.
import type { Migration, RawProfilesBlob } from "./types"
import type { EnhancementLevels, GearSlot } from "../engine/types"
import { GEAR_SLOTS } from "../engine/types"
import { DEFAULT_ENHANCEMENT_LEVEL, levelForEnhancementValue } from "../definitions/baseStats"

const KNOWN_SLOTS: ReadonlySet<string> = new Set(GEAR_SLOTS)

function isRec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function enhancementLevelsFromLegacyNodes(nodes: unknown): EnhancementLevels {
  const levelBySlot: Partial<Record<GearSlot, number>> = {}
  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      if (!isRec(node)) continue
      const { slot, stat, value } = node
      if (typeof slot !== "string" || typeof stat !== "string" || typeof value !== "number") {
        continue
      }
      if (!KNOWN_SLOTS.has(slot)) continue
      const level = levelForEnhancementValue(slot as GearSlot, stat, value)
      const current = levelBySlot[slot as GearSlot] ?? 0
      if (level > current) levelBySlot[slot as GearSlot] = level
    }
  }
  const out = {} as EnhancementLevels
  for (const slot of GEAR_SLOTS) out[slot] = levelBySlot[slot] ?? DEFAULT_ENHANCEMENT_LEVEL
  return out
}

function migrateInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(inputs.enhancements)) return inputs
  return { ...inputs, enhancements: enhancementLevelsFromLegacyNodes(inputs.enhancements) }
}

export const V24__enhancementLevelsPerSlot: Migration = {
  to: 24,
  name: "V24__enhancementLevelsPerSlot",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: migrateInputs(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 24, profiles }
  },
}
