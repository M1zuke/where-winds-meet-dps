// The floating umbrella's bullets are direct weapon hits that fly to the
// target instead of damage-over-time ticks that land on the pulse. A Skill
// Editor copy seeded before this still types them as a sustain tick with the
// Qi override that stood in for the missing typing. Only a dot still identical
// to what was seeded is rewritten: once it differs, a stale copy and a
// deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const DRONE_DEBUFF_ID = /^debuff-silkbindJade-umbdrone(-\d+hit)?$/
const BULLET_PROJECTILE = { speedMetersPerSecond: 30, maxTravelFrames: 60 }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healJadeDroneDot(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string" || !DRONE_DEBUFF_ID.test(debuff.id))
    return debuff
  const dot = debuff.dot
  if (
    !isRecord(dot) ||
    dot.skillType !== "sustain" ||
    dot.directHit !== undefined ||
    dot.projectile !== undefined
  )
    return debuff
  const { qiHitKind, ...rest } = dot
  const healed = {
    ...(qiHitKind === "direct" ? rest : dot),
    skillType: "weapon",
    directHit: true,
    projectile: BULLET_PROJECTILE,
  }
  return { ...debuff, dot: healed }
}

export const V20__jadeDroneDirectHitFlight: CustomDebuffMigration = {
  to: 20,
  name: "V20__jadeDroneDirectHitFlight",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs) ? blob.debuffs.map(healJadeDroneDot) : blob.debuffs
    return { ...blob, v: 20, debuffs }
  },
}
