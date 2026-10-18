import type { SetPanelBonus } from "../../../../definitions/sets/setDef"
import { setTierLevel } from "../../../../engine/setBonuses"

type SetBonusStat = SetPanelBonus["stat"]

const SET_BONUS_STAT_KEYS: Readonly<Record<SetBonusStat, string>> = {
  affinityRate: "content.statLine.affinity",
  critRate: "content.statLine.crit",
  precisionRate: "content.statLine.precision",
  maxPhys: "content.statLine.maxPhys",
  minPhys: "content.statLine.minPhys",
  physDef: "content.statLine.physDef",
}

const FLAT_STATS: readonly SetBonusStat[] = ["maxPhys", "minPhys", "physDef"]

export function setBonusStatKey(stat: SetBonusStat): string {
  return SET_BONUS_STAT_KEYS[stat]
}

export function formatSetBonusValue(stat: SetBonusStat, value: number): string {
  return FLAT_STATS.includes(stat) ? `+${Math.round(value)}` : `+${(value * 100).toFixed(1)}%`
}

export function setBonusValueAtLevel(
  bonus: Pick<SetPanelBonus, "value">,
  pieceLevel: number,
): number | null {
  const rung = setTierLevel([pieceLevel], 1, Object.keys(bonus.value).map(Number))
  if (rung === null) return null
  return bonus.value[rung as keyof SetPanelBonus["value"]] ?? null
}
