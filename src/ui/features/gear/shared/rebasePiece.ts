import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import type { GearPiece } from "../../../../engine/types"

export function rebasePiece(piece: GearPiece, fields: Partial<GearPiece>): GearPiece {
  const merged = { ...piece, ...fields }
  const base = gearBaseStatsFor(merged)
  return {
    ...merged,
    minPhys: base.minPhys,
    maxPhys: base.maxPhys,
    hp: base.hp,
    physDef: base.physDef,
  }
}
