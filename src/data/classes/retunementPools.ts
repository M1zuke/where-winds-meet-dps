// Stat ids must match `WordSpec.word` strings in `engine/itemRanking.ts`.

export interface RetunementPool {
  stats: readonly string[]
}

export const BELLSTRIKE_POOL: RetunementPool = {
  stats: ["Affinity", "Max Phys", "Momentum", "Max Bellstrike", "Power", "Crit"],
}
