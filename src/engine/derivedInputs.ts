import type { GearPiece, Inputs } from "./types"
import { GEAR_SLOTS } from "./types"
import { listKnownPaths, sumContributions } from "./gearStats"
import { getConfiguredBase, getMindMethodContributions } from "../definitions/baseStats"

export const DERIVED_STAT_FIELDS: readonly string[] = [
  ...new Set(listKnownPaths().map((path) => path.split(".")[0])),
  "classSpecificAttunement",
  // The previous shape held the same tag map under this key.
  "dingYinByTag",
]

export function withoutDerivedStats<T extends object>(value: T): T {
  const next = { ...value } as Record<string, unknown>
  for (const field of DERIVED_STAT_FIELDS) delete next[field]
  return next as T
}

const ZERO_ATTACK_BLOCK = { min: 0, max: 0, penetration: 0 }

export function withZeroedDerivedStats(inputs: Inputs): Inputs {
  const next: Record<string, unknown> = { ...inputs }
  for (const path of listKnownPaths()) {
    const [head, tail] = path.split(".")
    if (tail === undefined) {
      next[head] = 0
      continue
    }
    const block = next[head]
    next[head] =
      block && typeof block === "object" && !Array.isArray(block)
        ? { ...(block as Record<string, number>), [tail]: 0 }
        : { ...ZERO_ATTACK_BLOCK }
  }
  next.classSpecificAttunement = {}
  return next as unknown as Inputs
}

export function equippedPiecesFor(inputs: Inputs): GearPiece[] {
  const byId = new Map(inputs.inventory.map((p) => [p.id, p]))
  const out: GearPiece[] = []
  for (const slot of GEAR_SLOTS) {
    const id = inputs.equipped[slot]
    if (!id) continue
    const piece = byId.get(id)
    if (piece) out.push(piece)
  }
  return out
}

function clone(inputs: Inputs): Inputs {
  return {
    ...inputs,
    phys: { ...inputs.phys },
    bellstrike: { ...inputs.bellstrike },
    stonesplit: { ...inputs.stonesplit },
    silkbind: { ...inputs.silkbind },
    bamboocut: { ...inputs.bamboocut },
    classSpecificAttunement: {},
    mindMethods: inputs.mindMethods.map((m) => ({ ...m })) as Inputs["mindMethods"],
  }
}

function writePath(inputs: Inputs, path: string, value: number): void {
  if (path.startsWith("classSpecificAttunement.")) {
    inputs.classSpecificAttunement[path.slice("classSpecificAttunement.".length)] = value
    return
  }
  const parts = path.split(".")
  if (parts.length === 1) {
    ;(inputs as unknown as Record<string, number>)[parts[0]] = value
    return
  }
  const block = (inputs as unknown as Record<string, Record<string, number>>)[parts[0]]
  if (block) block[parts[1]] = value
}

export function withDerivedStats(inputs: Inputs): Inputs {
  const equipped = equippedPiecesFor(inputs)
  const mind = getMindMethodContributions(inputs)
  const gear = sumContributions(equipped, inputs)

  const gearByPath = new Map<string, number>()
  for (const e of gear) {
    gearByPath.set(e.path, (gearByPath.get(e.path) ?? 0) + e.amount)
  }

  const derive = (scaleSource: Inputs): Inputs => {
    const next = clone(inputs)
    const base = getConfiguredBase(scaleSource, equipped)
    for (const path of listKnownPaths()) {
      const sum = (base[path] ?? 0) + (mind[path] ?? 0) + (gearByPath.get(path) ?? 0)
      writePath(next, path, sum)
    }
    for (const e of gear) {
      if (e.path.startsWith("classSpecificAttunement.")) {
        writePath(next, e.path, e.amount)
      }
    }
    return next
  }

  // Two passes: an attack-path-scaled talent (e.g. Bellstrike Penetration
  // Scale, scales with `bellstrike.max`) must see the fully derived value, not
  // the raw typed input — pass 1 produces the derived attack totals, pass 2
  // re-derives talents scaled off pass 1.
  const pass1 = derive(inputs)
  return derive(pass1)
}
