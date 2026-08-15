import type { MechanicRegistration } from "../../engine/mechanics"

// The per-hit formula fields a 4-piece set bonus can populate — the surviving
// columns of the retired `setBonusFull.json`; see `formula.ts` for where each
// is read. A field a set doesn't carry is omitted, never zero-filled, so a
// generic `?? 0` lookup at the read site behaves identically to before.
export interface SetFormulaBonus {
  /** Hawking only — `formula.ts`'s `setFalcon` fallback below the AE/AG term. */
  physBoost?: number
  /** `Y` term. */
  affinityDamage?: number
  /** `panel.ts`'s Divinecraft-fire addend to `generalDamageBoost`. */
  lowQiDirectAffinityRate?: number
  /** `X` term. */
  critDamage?: number
  /** `V` term. */
  directCrit?: number
  /** Swaying Heights only — `panel.ts buildContext`'s `generalDamageBoost`. */
  generalDamageBoost?: number
}

// The 2-piece bonus: one scalar into one named panel stat.
export interface SetPanelBonus {
  stat: "affinityRate" | "critRate" | "precisionRate" | "maxPhys" | "minPhys"
  value: number
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
}

// Thin on purpose, like `defineSkill`/`defineBuff`/`defineDebuff`: it exists so
// TypeScript checks each literal at its definition site, and the `const` type
// parameter keeps the literal `id`/`siteKey` narrow.
export function defineSet<const T extends SetDef>(set: T): T {
  return set
}
