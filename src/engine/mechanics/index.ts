// A mechanic is declared by the thing it is a mechanic of — a class, an inner
// way, or a set — and registered by that owner's own registry
// (`src/definitions/classes/`, `src/definitions/innerWays/`,
// `src/definitions/sets/`), never here. This file holds only the contract and
// the registry (docs/CLASSES.md § "One definition per class").
import type { MechanicSetup, TimelineMechanic } from "./types"

export * from "./types"

export type AnyMechanic = TimelineMechanic<unknown>

export interface MechanicRegistration {
  mechanic: AnyMechanic
}

// Keeps a mechanic's `State` type checked all the way to `TimelineMechanic<State>`
// so a class/inner-way/set def writes one `MechanicRegistration` per mechanic
// without an `as unknown as AnyMechanic` cast of its own — the erasure to
// `AnyMechanic` happens once, here, instead of once per owner per mechanic.
export function declareMechanic<State>(mechanic: TimelineMechanic<State>): MechanicRegistration {
  return { mechanic: mechanic as unknown as AnyMechanic }
}

const registered: AnyMechanic[] = []

export function registerMechanic<State>(mechanic: TimelineMechanic<State>): void {
  if (registered.some((entry) => entry.id === mechanic.id)) return
  registered.push(mechanic as unknown as AnyMechanic)
}

export interface PreparedMechanic {
  mechanic: AnyMechanic
  state: unknown
}

export function prepareMechanics(setup: MechanicSetup): PreparedMechanic[] {
  const prepared: PreparedMechanic[] = []
  for (const mechanic of registered) {
    const state = mechanic.prepare(setup)
    if (state !== null && state !== undefined) prepared.push({ mechanic, state })
  }
  return prepared
}
