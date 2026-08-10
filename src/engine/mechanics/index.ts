// Registry order is load-bearing: contributions are applied in this order and
// float addition is not associative, so reordering can move the last bits of a
// result. This is the order the timeline applied them in when each was inline.
import { moraleMechanic } from "./morale"
import { levelAttributeBonusMechanic } from "./levelAttributeBonus"
import { concentrationMechanic } from "./concentration"
import { hawkwingMechanic } from "./hawkwing"
import { bitterSeasonMechanic } from "./bitterSeason"
import type { MechanicSetup, TimelineMechanic } from "./types"

export * from "./types"

type AnyMechanic = TimelineMechanic<unknown>

const MECHANICS: readonly AnyMechanic[] = [
  moraleMechanic,
  levelAttributeBonusMechanic,
  concentrationMechanic,
  hawkwingMechanic,
  bitterSeasonMechanic,
] as unknown as readonly AnyMechanic[]

export interface PreparedMechanic {
  mechanic: AnyMechanic
  state: unknown
}

export function prepareMechanics(setup: MechanicSetup): PreparedMechanic[] {
  const prepared: PreparedMechanic[] = []
  for (const mechanic of MECHANICS) {
    const state = mechanic.prepare(setup)
    if (state !== null && state !== undefined) prepared.push({ mechanic, state })
  }
  return prepared
}
