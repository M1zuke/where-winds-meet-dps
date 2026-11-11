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
  catEmperor: true,
  fivePoisonScorpion: true,
  cloudclutchSerpent: true,
  tidewatcher: true,
  jingniang: true,
  ironFlower: true,
}

const FIRST_BREAKTHROUGH_WITHOUT_BOSS_TALENT = 20

describe("Sword Trial bosses", () => {
  it("lists every boss id exactly once", () => {
    const ids = SWORD_TRIAL_BOSS_DEFS.map((boss) => boss.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual(Object.keys(EVERY_BOSS_ID).sort())
  })

  it("gives every boss that opens before breakthrough 20 the same base talent of 0.15", () => {
    for (const boss of SWORD_TRIAL_BOSS_DEFS)
      if (boss.minBreakthrough < FIRST_BREAKTHROUGH_WITHOUT_BOSS_TALENT)
        expect(boss.damageBoost).toBe(0.15)
  })

  it("gives the bosses that open at breakthrough 20 or later no talent at all", () => {
    const newest = SWORD_TRIAL_BOSS_DEFS.filter(
      (boss) => boss.minBreakthrough >= FIRST_BREAKTHROUGH_WITHOUT_BOSS_TALENT,
    )
    expect(newest.map((boss) => boss.id).sort()).toEqual([
      "catEmperor",
      "cloudclutchSerpent",
      "fivePoisonScorpion",
      "ironFlower",
      "jingniang",
      "tidewatcher",
    ])
    for (const boss of newest) {
      expect(boss.damageBoost).toBe(0)
      expect(boss.qiBreakDamageBoost).toEqual([])
    }
  })

  it("opens each boss at the breakthrough of its lowest-level version", () => {
    const openedAt = Object.fromEntries(
      SWORD_TRIAL_BOSS_DEFS.map((boss) => [boss.id, boss.minBreakthrough]),
    )
    expect(openedAt).toMatchObject({
      wolfMaiden: 14,
      snakeDoctor: 14,
      earthFiendDeity: 14,
      namelessGeneral: 14,
      fengRuzhi: 14,
      horseTamer: 16,
      ironheartCentipede: 17,
      ciAndCuo: 17,
      lodestarSwordmaster: 18,
    })
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
