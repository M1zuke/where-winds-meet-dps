export type SwordTrialBossId =
  | "voidKing"
  | "yeWanshan"
  | "luckySeventeen"
  | "sleepingDaoist"
  | "murongYuan"
  | "drunkMartialArtist"
  | "shadowPuppeteer"
  | "riverMaster"
  | "coffinMaster"
  | "wolfMaiden"
  | "snakeDoctor"
  | "earthFiendDeity"
  | "namelessGeneral"
  | "fengRuzhi"
  | "horseTamer"
  | "ironheartCentipede"
  | "ciAndCuo"
  | "lodestarSwordmaster"
  | "bellToller"
  | "rosyFacedSwordsworn"
  | "yeluAbuli"

export interface QiBreakTalentRung {
  fromBreakthrough: number
  damageBoost: number
}

export interface SwordTrialBossDef {
  id: SwordTrialBossId
  name: string
  minBreakthrough: number
  damageBoost: number
  qiBreakDamageBoost: readonly QiBreakTalentRung[]
}

export function defineSwordTrialBosses<const Bosses extends readonly SwordTrialBossDef[]>(
  bosses: Bosses,
): readonly SwordTrialBossDef[] {
  return bosses
}
