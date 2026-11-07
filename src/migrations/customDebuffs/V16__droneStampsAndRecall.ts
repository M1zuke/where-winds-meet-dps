// v15 → v16 — the floating umbrella's runs re-arm toward absolute deadlines,
// which fixes how late each run's Combo - Extend Mark stamp lands, and a
// fixed-count floating umbrella is recalled by an umbrella skill's cast. A
// Skill Editor copy seeded before this lacks both fields. Each field is added
// only while it is absent: once it exists, a stale copy and a deliberate edit
// are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const DRONE_DEBUFF_ID = /^debuff-silkbindJade-umbdrone(-\d+hit)?$/
const FIXED_COUNT_DRONE_DEBUFF_ID = /^debuff-silkbindJade-umbdrone-\d+hit$/

const RECALL = {
  tag: "weapon:Umbrella",
  exemptSkillIds: [
    "silkbindJade-hidden-sword-light-1",
    "silkbindJade-hidden-sword-light-2",
    "silkbindJade-hidden-sword-light-3",
    "silkbindJade-hidden-sword-light-4",
    "silkbindJade-hidden-sword-light-5",
    "silkbindJade-hidden-sword-heavy-1",
    "silkbindJade-hidden-sword-heavy-2",
    "silkbindJade-hidden-sword-heavy-3",
    "silkbindJade-hidden-sword-heavy-alt",
  ],
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healDroneStampsAndRecall(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  if (!DRONE_DEBUFF_ID.test(debuff.id)) return debuff
  const dot =
    isRecord(debuff.dot) && debuff.dot.rearmsToAbsoluteDeadline === undefined
      ? { ...debuff.dot, rearmsToAbsoluteDeadline: true }
      : debuff.dot
  const recall =
    FIXED_COUNT_DRONE_DEBUFF_ID.test(debuff.id) && debuff.recall === undefined
      ? { recall: { tag: RECALL.tag, exemptSkillIds: [...RECALL.exemptSkillIds] } }
      : {}
  return { ...debuff, dot, ...recall }
}

export const V16__droneStampsAndRecall: CustomDebuffMigration = {
  to: 16,
  name: "V16__droneStampsAndRecall",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healDroneStampsAndRecall)
      : blob.debuffs
    return { ...blob, v: 16, debuffs }
  },
}
