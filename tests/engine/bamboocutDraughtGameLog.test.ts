// Scoped to Bamboocut Draught's built-in dummy rotation (docs/TESTING.md
// § "Class scoping"): the hit counts of a 60 s training-dummy run read from
// the in-game damage log (2026-09-05), one row per breakdown name. The log
// opens with the pull, so pre-pull hits are left out. Damage is not asserted
// — the class carries no validated anchor.
import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { SET_ID } from "../../src/data/sets/ids"

const CLASS = "bamboocutDraught"

const IN_GAME_HITS: Record<string, number> = {
  "Dragonquench - Inebriate": 72,
  "Hero's Blood - Inebriate": 44,
  "Drunkslay State": 3,
  Castlink: 12,
  Whaledraft: 18,
  "Nightwick - Primepick": 6,
  Peakfall: 5,
  "Hero's Blood": 8,
  "Flute Chanting a Thousand Waves": 10,
}

function runDummyRotation() {
  const classDef = classDefinition(CLASS)!
  const rotation = classDef.rotations.find((r) => r.id === classDef.defaultRotationId)!
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    breakthrough: 17,
    set: SET_ID.tiltrim,
    mindMethods: [
      { id: INNER_WAY_ID.eonpour, name: "Eonpour", stacks: "6" },
      { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: "6" },
      { id: INNER_WAY_ID.mistwing, name: "Mistwing", stacks: "6" },
      { id: INNER_WAY_ID.volutefit, name: "Volutefit", stacks: "6" },
    ],
    activeCustomRotation: rotation,
  })
}

function loggedHitsByRow(result: ReturnType<typeof runEngine>): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of result.perSkill) {
    if (row.expectedDamage <= 0 || row.name.endsWith("Prepull")) continue
    const name = row.breakdownName ?? row.name
    counts[name] = (counts[name] ?? 0) + row.count
  }
  return counts
}

describe("the dummy rotation against the in-game damage log", () => {
  const result = runDummyRotation()
  const hits = loggedHitsByRow(result)

  it("lands every hit the log books, row for row", () => {
    for (const [row, expected] of Object.entries(IN_GAME_HITS)) {
      expect(hits[row], row).toBe(expected)
    }
  })

  it("parries Reveldrift after its first hit, where the logged run let one second hit through", () => {
    expect(hits.Reveldrift).toBe(2)
  })

  it("runs the whole rotation in about a minute, as the log did", () => {
    expect(result.rotationDuration).toBeGreaterThan(58)
    expect(result.rotationDuration).toBeLessThan(62)
  })
})
