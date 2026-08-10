import type { Inputs } from "./types"
import artsConditionals from "../data/skills/boosts/artsConditionals.json"
import { slotInnerWayId } from "../data/classes/innerWays"

interface CheckxinfRule {
  fn: "checkxinf"
  innerWayId: string
  then: number | string
  else: number | string
}
interface CheckxinfaRule {
  fn: "Checkxinfa"
  innerWayId: string
  tier: string
  then: number | string
  else: number | string
}
type Rule = CheckxinfRule | CheckxinfaRule

const ARTS_COND = artsConditionals as Record<string, Record<string, Rule[]>>

export interface MindMethodOverrides {
  artsOverrides: Record<string, Record<string, number>>
  boostZoneOverrides: Record<string, Record<string, number>>
}

function resolveRule(rule: Rule, inputs: Inputs): number {
  const slot = inputs.mindMethods.find((candidate) => slotInnerWayId(candidate) === rule.innerWayId)
  let result: number | string
  if (rule.fn === "Checkxinfa") {
    result = slot?.stacks === rule.tier ? rule.then : rule.else
  } else {
    result = slot ? rule.then : rule.else
  }
  return typeof result === "number" ? result : 0
}

function resolveRules(rules: Rule[], inputs: Inputs): number {
  let total = 0
  for (const rule of rules) total += resolveRule(rule, inputs)
  return total
}

export function resolveMindMethodOverrides(inputs: Inputs): MindMethodOverrides {
  const artsOverrides: Record<string, Record<string, number>> = {}
  for (const [skill, fields] of Object.entries(ARTS_COND)) {
    for (const [field, rules] of Object.entries(fields)) {
      const delta = resolveRules(rules, inputs)
      artsOverrides[skill] ??= {}
      artsOverrides[skill][field] = delta
    }
  }

  // Every boost-zone rule referenced an inner way removed as unimplemented
  // (2026-08-10), so the table is gone. The `boostZoneOverrides` channel itself
  // was already inert — CALCULATION.md § "What the live path does not exercise"
  // records that slots are always "N/A" — so the plumbing stays and carries
  // nothing.
  const boostZoneOverrides: Record<string, Record<string, number>> = {}

  return { artsOverrides, boostZoneOverrides }
}
