import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"

// In-game values as of 2026-09-24: 15% max HP, 8 s, granted at Total
// Annihilation: Supreme's own hit — a defensive marker only.
export const totalAnnihilationSupremeShield = defineBuff({
  id: BUFF.totalAnnihilationSupremeShield,
  name: "Shield",
  duration: 8,
  effects: [],
})
