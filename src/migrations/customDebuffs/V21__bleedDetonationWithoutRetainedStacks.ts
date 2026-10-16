// The two Bleeding stacks Sword Horizon's tier 6 keeps after a detonation are
// re-added by the Blood Burst skill as it lands, so the detonation no longer
// carries a tier-gated retained amount. A Skill Editor copy seeded before this
// still stores the retained-stack fields, which nothing reads any more. Only
// the fields still identical to what was seeded are removed: once they differ,
// a stale copy and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const BLEED_TICK_ID = "debuff-bellstrikeUmbra-bleed-tick"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healBleedDetonationRetention(debuff: unknown): unknown {
  if (!isRecord(debuff) || debuff.id !== BLEED_TICK_ID) return debuff
  const detonation = debuff.detonation
  if (
    !isRecord(detonation) ||
    detonation.retainParam !== "swordHorizon" ||
    detonation.retainMinTier !== 6 ||
    detonation.retainParamStacks !== 2
  )
    return debuff
  const {
    retainParam: _retainParam,
    retainMinTier: _retainMinTier,
    retainParamStacks: _retainParamStacks,
    ...kept
  } = detonation
  return { ...debuff, detonation: kept }
}

export const V21__bleedDetonationWithoutRetainedStacks: CustomDebuffMigration = {
  to: 21,
  name: "V21__bleedDetonationWithoutRetainedStacks",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healBleedDetonationRetention)
      : blob.debuffs
    return { ...blob, v: 21, debuffs }
  },
}
