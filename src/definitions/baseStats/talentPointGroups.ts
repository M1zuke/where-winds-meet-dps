import { TALENT_POINTS, TALENT_POINT_TIERS } from "../../data/baseStats"
import type { DisabledTalentPoints } from "../../engine/types"
import type { TalentPointEffects, TalentPointStat } from "./talentPointDef"

export interface TalentPointMember {
  tier: string
  id: number
  effects: TalentPointEffects
}

export interface TalentPointGroup {
  key: string
  stats: readonly TalentPointStat[]
  members: readonly TalentPointMember[]
}

const STAT_ORDER: Readonly<Record<TalentPointStat, number>> = {
  minPhys: 0,
  maxPhys: 1,
  minFormless: 2,
  maxFormless: 3,
  precisionRate: 4,
  critRate: 5,
  critDamage: 6,
  affinityRate: 7,
  affinityDamage: 8,
  power: 9,
  agility: 10,
  momentum: 11,
}

export function talentPointStats(effects: TalentPointEffects): TalentPointStat[] {
  return (Object.keys(effects) as TalentPointStat[]).sort(
    (left, right) => STAT_ORDER[left] - STAT_ORDER[right],
  )
}

function byRichestStepFirst(left: TalentPointMember, right: TalentPointMember): number {
  const stat = talentPointStats(left.effects)[0]
  const byValue = (right.effects[stat] ?? 0) - (left.effects[stat] ?? 0)
  if (byValue !== 0) return byValue
  if (left.tier !== right.tier) return left.tier < right.tier ? -1 : 1
  return left.id - right.id
}

function byLeadingStat(left: TalentPointGroup, right: TalentPointGroup): number {
  const byStat = STAT_ORDER[left.stats[0]] - STAT_ORDER[right.stats[0]]
  if (byStat !== 0) return byStat
  return left.stats.length - right.stats.length
}

export const TALENT_POINT_GROUPS: readonly TalentPointGroup[] = (() => {
  const byKey = new Map<string, TalentPointGroup & { members: TalentPointMember[] }>()
  for (const tier of TALENT_POINT_TIERS) {
    for (const point of TALENT_POINTS[tier]) {
      const stats = talentPointStats(point.effects)
      const key = stats.join("|")
      const member = { tier, id: point.id, effects: point.effects }
      const group = byKey.get(key)
      if (group) {
        group.members.push(member)
        continue
      }
      byKey.set(key, { key, stats, members: [member] })
    }
  }
  for (const group of byKey.values()) group.members.sort(byRichestStepFirst)
  return [...byKey.values()].sort(byLeadingStat)
})()

export function isTalentPointEnabled(
  disabled: DisabledTalentPoints | undefined,
  tier: string,
  id: number,
): boolean {
  return !disabled?.[tier]?.includes(id)
}

export function withTalentPointEnabled(
  disabled: DisabledTalentPoints | undefined,
  member: TalentPointMember,
  enabled: boolean,
): DisabledTalentPoints {
  const next: DisabledTalentPoints = {}
  for (const [tier, ids] of Object.entries(disabled ?? {})) next[tier] = [...ids]
  const ids = next[member.tier] ?? []
  next[member.tier] = enabled
    ? ids.filter((id) => id !== member.id)
    : ids.includes(member.id)
      ? ids
      : [...ids, member.id].sort((left, right) => left - right)
  if (next[member.tier].length === 0) delete next[member.tier]
  return next
}

export function enabledMembers(
  group: TalentPointGroup,
  disabled: DisabledTalentPoints | undefined,
): TalentPointMember[] {
  return group.members.filter((member) => isTalentPointEnabled(disabled, member.tier, member.id))
}

export function groupTotals(
  group: TalentPointGroup,
  disabled: DisabledTalentPoints | undefined,
): Readonly<Partial<Record<TalentPointStat, number>>> {
  const totals: Partial<Record<TalentPointStat, number>> = {}
  for (const stat of group.stats) totals[stat] = 0
  for (const member of enabledMembers(group, disabled)) {
    for (const stat of group.stats) totals[stat] = (totals[stat] ?? 0) + (member.effects[stat] ?? 0)
  }
  return totals
}
