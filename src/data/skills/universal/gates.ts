import type { Buff } from "../../../engine/buff"
import { MIRAGE_ENDURANCE_COST_REDUCTION_GATE } from "./buffs/mirageEnduranceCostReduction"

// Ledger gate buffs a universal skill needs on every class's own buff pool,
// the same way `withUniversalSkills` stamps its skill pool — composed in
// `definitions/classes/registry.ts`.
export const UNIVERSAL_GATES: readonly Buff[] = [MIRAGE_ENDURANCE_COST_REDUCTION_GATE]
