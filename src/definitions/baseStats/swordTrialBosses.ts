import { SWORD_TRIAL_BOSS_DEFS } from "../../data/baseStats"
import type { SwordTrialBossDef, SwordTrialBossId } from "./swordTrialBossDef"

export type { SwordTrialBossDef, SwordTrialBossId } from "./swordTrialBossDef"

export const SWORD_TRIAL_BOSSES: readonly SwordTrialBossDef[] = SWORD_TRIAL_BOSS_DEFS

export const DEFAULT_SWORD_TRIAL_BOSS_ID: SwordTrialBossId = "riverMaster"

export function isSwordTrialBossId(value: unknown): value is SwordTrialBossId {
  return SWORD_TRIAL_BOSSES.some((boss) => boss.id === value)
}

function bossById(id: SwordTrialBossId): SwordTrialBossDef {
  return SWORD_TRIAL_BOSSES.find((boss) => boss.id === id)!
}

export function swordTrialBossFor(inputs: {
  swordTrialBoss?: string
  breakthrough: number
}): SwordTrialBossDef {
  const stored = SWORD_TRIAL_BOSSES.find((boss) => boss.id === inputs.swordTrialBoss)
  return stored && stored.minBreakthrough <= inputs.breakthrough
    ? stored
    : bossById(DEFAULT_SWORD_TRIAL_BOSS_ID)
}

export function qiBreakTalentDamageBoostAt(boss: SwordTrialBossDef, breakthrough: number): number {
  let damageBoost = 0
  for (const rung of boss.qiBreakDamageBoost)
    if (rung.fromBreakthrough <= breakthrough) damageBoost = rung.damageBoost
  return damageBoost
}
