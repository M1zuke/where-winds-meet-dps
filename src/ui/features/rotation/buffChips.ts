import type { CastBuffTag, RotationCast } from "../../../engine/types"

export const PINNED_BUFF_HUES: Record<string, number> = {
  "Bleed Tick": 0,
  Smolder: 30,
  "Zenith Bar": 200,
  "Bitter Season Tick": 100,
  "Bitter Season Poison": 130,
}

export const FALLBACK_BUFF_HUES: readonly number[] = [
  70, 95, 120, 145, 165, 250, 270, 290, 310, 330,
]

export function buffChipHue(name: string, id?: string): number {
  const pinned = PINNED_BUFF_HUES[name]
  if (pinned !== undefined) return pinned
  const key = name || id || ""
  let h = 5381
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h + key.charCodeAt(i)) | 0
  }
  return FALLBACK_BUFF_HUES[(h >>> 0) % FALLBACK_BUFF_HUES.length]
}

export function castBuffDisplayOrder(
  casts: readonly RotationCast[] | undefined,
  hiddenIds: ReadonlySet<string>,
): Map<string, number> {
  const map = new Map<string, number>()
  if (!casts || casts.length === 0) return map
  const sorted = [...casts].sort((a, b) => a.index - b.index || a.timeSec - b.timeSec)
  for (const cast of sorted) {
    for (const tag of cast.buffs) {
      if (hiddenIds.has(tag.id)) continue
      if (!map.has(tag.id)) map.set(tag.id, map.size)
    }
  }
  return map
}

export function visibleCastBuffs(
  buffs: readonly CastBuffTag[],
  hiddenIds: ReadonlySet<string>,
  order: ReadonlyMap<string, number>,
): CastBuffTag[] {
  return buffs
    .filter((tag) => !hiddenIds.has(tag.id))
    .slice()
    .sort((a, b) => {
      const oa = order.get(a.id) ?? Number.MAX_SAFE_INTEGER
      const ob = order.get(b.id) ?? Number.MAX_SAFE_INTEGER
      if (oa !== ob) return oa - ob
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    })
}
