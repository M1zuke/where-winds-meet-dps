import type { GearLevelValues } from "../../engine/types"
import type { MechanicRegistration } from "../../engine/mechanics"
import type { PARAM } from "../../data/skills/buffs/ids"

// A field a set doesn't carry is omitted, never zero-filled: a zero here reads
// as a bonus deliberately measured at nothing, which is not the same claim.
export interface SetFormulaBonus {
  /** `formula.ts`'s `setFalcon` fallback below the AE/AG term. */
  physBoost?: number
  /** `panel.ts buildContext`'s `generalDamageBoost`. */
  generalDamageBoost?: number
}

// The 2-piece bonus: one scalar into one named panel stat, per gear level.
export interface SetPanelBonus {
  stat: "affinityRate" | "critRate" | "precisionRate" | "maxPhys" | "minPhys" | "physDef"
  value: GearLevelValues
}

export interface SetDef {
  id: string
  name: string
  /** The reference site's own key, compared against a `BuffModule.requires.set`
   * and `BuffParams.armorSet` — undefined for a set no buff ever gates on. */
  siteKey?: string
  formulaBonus?: SetFormulaBonus
  panelBonus?: SetPanelBonus
  mechanics?: readonly MechanicRegistration[]
  // Set true in `BuffParams` only while this set is the one equipped — the
  // generic param a hit trigger's own `requiresParam`/condition reads,
  // mirroring an inner way's own `buffParam`, for a set-gated mechanic
  // `BuffModule.requires.set` cannot reach (it only gates a class-buff
  // module, never a hit-level trigger or condition).
  buffParam?: (typeof PARAM)[keyof typeof PARAM]
}

// Thin on purpose, like `defineSkill`/`defineBuff`/`defineDebuff`: it exists so
// TypeScript checks each literal at its definition site, and the `const` type
// parameter keeps the literal `id`/`siteKey` narrow.
export function defineSet<const T extends SetDef>(set: T): T {
  return set
}
