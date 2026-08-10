// One def per inner way that moves a context-level term, replacing the
// hardcoded `has("Soldier's Return")` style checks that were spread across
// `panel.ts` and `buffs/innerWayBonus.ts`.
//
// CALCULATION.md § "Mind-method layers" lists four disjoint channels an inner
// way can act through. This file is channel 2 (context scalars) and the
// all-damage part of channel 4; channel 1 stays in
// `mindMethodPanelStats.json`, channel 3 in `mindMethodOverrides.ts`, and the
// triggered part of channel 4 in the buff defs.
//
// A def without `minTier` applies whenever the inner way is slotted at all.

export interface InnerWayDef {
  name: string
  minTier?: number
  // Additive into `FormulaContext.generalDamageBoost`.
  generalDamageBoost?: number
  // Additive into `FormulaContext.chargeBonus`, which only charged skills read.
  chargeBonus?: number
  // The always-on DoT boost, superseded by a mechanic's `dotDamageMultiplier`.
  dotDamageBoost?: number
  // Flat all-damage the inner way grants merely by being selected (the site's
  // `Ss[key].allDamageBonus`, `zo()` ~L7743-65).
  allDamageBonus?: number
  // Multiplies the target's physical defense. Year-Long Lament at tier 6 is the
  // self-applied equivalent of the party's shared HenZhi debuff.
  targetDefenseMultiplier?: number
}

export const INNER_WAY_DEFS: readonly InnerWayDef[] = [
  { name: "Soldier's Return", generalDamageBoost: 0.08 },
  { name: "Star-Picker", minTier: 6, generalDamageBoost: 0.03 },
  { name: "Endurance Doctrine", generalDamageBoost: 0.02 },
  { name: "Mighty Song", chargeBonus: 0.15 },
  { name: "Insightful Strike", dotDamageBoost: 0.1, allDamageBonus: 0.015 },
  { name: "Year-Long Lament", minTier: 6, targetDefenseMultiplier: 0.94 },
]

export interface SlottedInnerWay {
  name: string
  stacks: string
}

function tierOf(stacks: string): number {
  const match = /(\d+)/.exec(stacks ?? "")
  return match ? Number(match[1]) : 0
}

// The defs whose tier requirement the build satisfies.
export function activeInnerWayDefs(slots: readonly SlottedInnerWay[]): InnerWayDef[] {
  const out: InnerWayDef[] = []
  for (const def of INNER_WAY_DEFS) {
    const slot = slots.find((candidate) => candidate.name === def.name)
    if (!slot) continue
    if (def.minTier && tierOf(slot.stacks) < def.minTier) continue
    out.push(def)
  }
  return out
}

export function innerWayScalar(
  slots: readonly SlottedInnerWay[],
  channel: "generalDamageBoost" | "chargeBonus" | "dotDamageBoost" | "allDamageBonus",
): number {
  let total = 0
  for (const def of activeInnerWayDefs(slots)) total += def[channel] ?? 0
  return total
}

export function innerWayTargetDefenseMultiplier(slots: readonly SlottedInnerWay[]): number | null {
  for (const def of activeInnerWayDefs(slots))
    if (def.targetDefenseMultiplier !== undefined) return def.targetDefenseMultiplier
  return null
}
