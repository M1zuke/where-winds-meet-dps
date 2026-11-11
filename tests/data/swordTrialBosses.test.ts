import { describe, expect, it } from "vitest"
import { SWORD_TRIAL_BOSS_DEFS } from "../../src/data/baseStats"
import { BREAKTHROUGH_TIERS } from "../../src/definitions/baseStats/breakthroughs"
import {
  DEFAULT_SWORD_TRIAL_BOSS_ID,
  qiBreakTalentDamageBoostAt,
  type SwordTrialBossId,
} from "../../src/definitions/baseStats/swordTrialBosses"

const EVERY_BOSS_ID: Record<SwordTrialBossId, true> = {
  voidKing: true,
  yeWanshan: true,
  luckySeventeen: true,
  sleepingDaoist: true,
  murongYuan: true,
  drunkMartialArtist: true,
  shadowPuppeteer: true,
  riverMaster: true,
  coffinMaster: true,
  wolfMaiden: true,
  snakeDoctor: true,
  earthFiendDeity: true,
  namelessGeneral: true,
  fengRuzhi: true,
  horseTamer: true,
  ironheartCentipede: true,
  ciAndCuo: true,
  lodestarSwordmaster: true,
  bellToller: true,
  rosyFacedSwordsworn: true,
  yeluAbuli: true,
}

describe("Sword Trial bosses", () => {
  it("lists every boss id exactly once", () => {
    const ids = SWORD_TRIAL_BOSS_DEFS.map((boss) => boss.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual(Object.keys(EVERY_BOSS_ID).sort())
  })

  it("gives every boss the same base talent of 0.15", () => {
    for (const boss of SWORD_TRIAL_BOSS_DEFS) expect(boss.damageBoost).toBe(0.15)
  })

  it("orders each Qi break ladder by breakthrough, from the boss's first breakthrough", () => {
    for (const boss of SWORD_TRIAL_BOSS_DEFS) {
      const rungs = boss.qiBreakDamageBoost
      if (rungs.length === 0) continue
      expect(rungs[0].fromBreakthrough).toBe(boss.minBreakthrough)
      for (let index = 1; index < rungs.length; index++)
        expect(rungs[index].fromBreakthrough).toBeGreaterThan(rungs[index - 1].fromBreakthrough)
    }
  })

  it("opens every boss at a modelled breakthrough", () => {
    const modelled = BREAKTHROUGH_TIERS.map((tier) => tier.breakthrough)
    for (const boss of SWORD_TRIAL_BOSS_DEFS) expect(modelled).toContain(boss.minBreakthrough)
  })

  it("keeps the default boss open at every breakthrough and without a Qi break talent", () => {
    const boss = SWORD_TRIAL_BOSS_DEFS.find((entry) => entry.id === DEFAULT_SWORD_TRIAL_BOSS_ID)!
    for (const tier of BREAKTHROUGH_TIERS) {
      expect(boss.minBreakthrough).toBeLessThanOrEqual(tier.breakthrough)
      expect(qiBreakTalentDamageBoostAt(boss, tier.breakthrough)).toBe(0)
    }
  })
})
