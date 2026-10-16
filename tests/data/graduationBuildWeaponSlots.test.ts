// Scoped to every registered class: a metadata guard, not a damage assertion.
import { describe, expect, it } from "vitest"
import { gearWordPoolForLine } from "../../src/data/stats/gearWordPools"
import {
  CLASS_DEFS,
  classDefinition,
  weaponTypeForSlot,
} from "../../src/definitions/classes/registry"

describe("every graduation build's weapon pieces fit their art's slot", () => {
  const cases = CLASS_DEFS().flatMap((classDef) =>
    classDefinition(classDef.id)!.graduationBuilds.map((build) => [classDef.id, build] as const),
  )

  it.each(cases.map(([classId, build]) => [classId, build.id, build] as const))(
    "%s / %s",
    (classId, _buildId, build) => {
      for (const piece of build.gear.filter((gear) => gear.slot.endsWith("Weapon"))) {
        const weaponType = weaponTypeForSlot(classId, piece.slot)
        piece.words.forEach((entry, lineIndex) => {
          const pool = gearWordPoolForLine(piece.level, piece.slot, lineIndex, weaponType)
          expect(pool, `${piece.slot} line ${lineIndex} ${entry.word}`).toContain(entry.word)
        })
      }
    },
  )

  it("covers at least one build per registered class", () => {
    for (const classDef of CLASS_DEFS())
      expect(classDefinition(classDef.id)!.graduationBuilds.length).toBeGreaterThan(0)
  })
})
