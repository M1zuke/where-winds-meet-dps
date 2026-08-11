// Per-class entries are intentionally duplicated rather than deduped behind a
// shared path key, so per-class tweaks later don't require a data migration.
// Stat ids must match `WordSpec.word` strings in `engine/itemRanking.ts`.

export interface RetunementPool {
  stats: readonly string[]
}

const BELLSTRIKE_POOL: RetunementPool = {
  stats: ["Affinity", "Max Phys", "Momentum", "Max Bellstrike", "Power", "Crit"],
}

const BAMBOOCUT_POOL: RetunementPool = {
  stats: ["Momentum", "Agility", "Max Bamboocut", "Min Phys", "Max Phys", "Crit"],
}

const STONESPLIT_POOL: RetunementPool = {
  stats: ["Min Phys", "Max Phys", "Max Stonesplit", "Crit", "Power", "Agility"],
}

export const RETUNEMENT_POOLS: Record<string, RetunementPool> = {
  bellstrikeRainbow: BELLSTRIKE_POOL,
  bellstrikeUmbra: BELLSTRIKE_POOL,
  bamboocutWindTwinblade: BAMBOOCUT_POOL,
  bamboocutDust: BAMBOOCUT_POOL,
  stonesplitStrength: STONESPLIT_POOL,
}

export function poolForClass(classId: string): RetunementPool | null {
  return RETUNEMENT_POOLS[classId] ?? null
}
