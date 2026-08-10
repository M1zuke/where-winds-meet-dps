// The per-hit formula fields a 4-piece set bonus can populate — the surviving
// columns of the retired `setBonusFull.json`; see `formula.ts` for where each
// is read. A field a set doesn't carry is omitted, never zero-filled, so a
// generic `?? 0` lookup at the read site behaves identically to before.
export interface SetFormulaBonus {
  /** Hawking only — `formula.ts`'s `setFalcon` fallback below the AE/AG term. */
  physBoost?: number
  /** `Y` term. */
  affinityDamage?: number
  /** `W` term, gated on low Qi. */
  lowQiDirectAffinityRate?: number
  /** `X` term. */
  critDamage?: number
  /** `V` term. */
  directCrit?: number
  /** `attrBlock`'s `setLowQiBonus`, gated on low Qi — applied to every
   * attribute block alike, not scoped to Bamboocut despite the name;
   * preserved exactly as inherited. */
  lowQiBambooDamage?: number
  /** Swaying Heights only — `panel.ts buildContext`'s `generalDamageBoost`. */
  generalDamageBoost?: number
}

// The 2-piece bonus, formerly `armorSetBoni.json` — a single scalar into one
// named panel stat, applied by `panel.ts applyArmorSet`.
export interface SetPanelBonus {
  stat: "affinityRate" | "critRate" | "precisionRate" | "maxPhys"
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
}

// Thin on purpose, like `defineSkill`/`defineBuff`/`defineDebuff`: it exists so
// TypeScript checks each literal at its definition site, and the `const` type
// parameter keeps the literal `id`/`siteKey` narrow.
export function defineSet<const T extends SetDef>(set: T): T {
  return set
}
