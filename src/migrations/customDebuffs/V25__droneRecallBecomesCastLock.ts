// v24 → v25 — an umbrella cast no longer recalls the fixed-count floating
// umbrella: it only flags the cast as illegal, and Return of Spring is the
// recall. A Skill Editor copy seeded before this carries the old `recall`
// spec. Only a spec still identical to what was seeded is replaced: once it
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const FIXED_COUNT_DRONE_DEBUFF_ID = /^debuff-silkbindJade-umbdrone-\d+hit$/

const SEEDED_RECALL = {
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
const RETURN_OF_SPRING_ID = "silkbindJade-return-of-spring"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healDroneRecall(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  if (!FIXED_COUNT_DRONE_DEBUFF_ID.test(debuff.id)) return debuff
  if (JSON.stringify(debuff.recall) !== JSON.stringify(SEEDED_RECALL)) return debuff
  const { recall: _seeded, ...rest } = debuff
  return {
    ...rest,
    castLock: {
      tag: SEEDED_RECALL.tag,
      recallSkillId: RETURN_OF_SPRING_ID,
      exemptSkillIds: [...SEEDED_RECALL.exemptSkillIds],
    },
  }
}

export const V25__droneRecallBecomesCastLock: CustomDebuffMigration = {
  to: 25,
  name: "V25__droneRecallBecomesCastLock",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs) ? blob.debuffs.map(healDroneRecall) : blob.debuffs
    return { ...blob, v: 25, debuffs }
  },
}
