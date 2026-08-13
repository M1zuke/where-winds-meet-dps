// A mechanic is declared by the thing it is a mechanic of — a class, an inner
// way, or a set — and registered by that owner's own registry
// (`src/definitions/classes/`, `src/definitions/innerWays/`,
// `src/definitions/sets/`), never here. This file holds only the contract and
// the registry (docs/CLASSES.md § "One definition per class").
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

export type AnyMechanic = TimelineMechanic<unknown>

export interface MechanicRegistration {
  mechanic: AnyMechanic
  order: number
}

// Keeps a mechanic's `State` type checked all the way to `TimelineMechanic<State>`
// so a class/inner-way/set def writes one `MechanicRegistration` per mechanic
// without an `as unknown as AnyMechanic` cast of its own — the erasure to
// `AnyMechanic` happens once, here, instead of once per owner per mechanic.
export function declareMechanic<State>(
  mechanic: TimelineMechanic<State>,
  order: number,
): MechanicRegistration {
  return { mechanic: mechanic as unknown as AnyMechanic, order }
}

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
