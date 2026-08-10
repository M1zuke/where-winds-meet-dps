// Mechanics SELF-REGISTER, so a class can add one without this file changing.
// That is the point: adding a class means adding files under
// `src/data/classes/` and one line in that folder's barrel — never editing the
// engine (docs/GENERALIZATION.md § P9).
//
// `order` is load-bearing, not cosmetic. Contributions are applied in it and
// float addition is not associative, so changing it can move the last bits of
// a result. The values below are the order the timeline applied these in when
// each was still inline; a new mechanic picks a slot deliberately.
import type { MechanicSetup, TimelineMechanic } from "./types"

export * from "./types"

export const MECHANIC_ORDER = {
  morale: 10,
  levelAttributeBonus: 20,
  concentration: 30,
  hawkwing: 40,
  bitterSeason: 50,
} as const

type AnyMechanic = TimelineMechanic<unknown>

const registered: { mechanic: AnyMechanic; order: number }[] = []

export function registerMechanic<State>(mechanic: TimelineMechanic<State>, order: number): void {
  if (registered.some((entry) => entry.mechanic.id === mechanic.id)) return
  registered.push({ mechanic: mechanic as unknown as AnyMechanic, order })
  registered.sort((a, b) => a.order - b.order)
}

export interface PreparedMechanic {
  mechanic: AnyMechanic
  state: unknown
}

export function prepareMechanics(setup: MechanicSetup): PreparedMechanic[] {
  const prepared: PreparedMechanic[] = []
  for (const { mechanic } of registered) {
    const state = mechanic.prepare(setup)
    if (state !== null && state !== undefined) prepared.push({ mechanic, state })
  }
  return prepared
}
