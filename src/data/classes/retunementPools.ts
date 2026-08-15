import type { RetunementPool } from "../../definitions/classes/classDef"
import type { AttributeKey } from "../../engine/types"

// Keyed by primary attribute, not by class: every class on an attribute retunes
// towards the same words, so two classes sharing one cannot drift apart. An
// attribute with no registered class yet has no entry, and `poolForClass`
// returns null rather than a guess.
export const RETUNEMENT_POOLS: Partial<Record<AttributeKey, RetunementPool>> = {
  Bellstrike: { stats: ["affinity", "maxPhys", "momentum", "maxBellstrike", "power", "crit"] },
  Stonesplit: { stats: ["minPhys", "maxPhys", "maxStonesplit", "crit", "power", "agility"] },
}
