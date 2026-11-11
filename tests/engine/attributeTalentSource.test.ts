import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { equippedPiecesFor, withDerivedStats } from "../../src/engine/derivedInputs"
import { graduationInputs } from "../../src/engine/graduation"
import { graduationBuildsFor } from "../../src/definitions/graduationBuilds/registry"
import { defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { buildScalingSources } from "../../src/definitions/baseStats"
import type { Inputs } from "../../src/engine/types"

function graduated(classId: string, breakthrough: number): Inputs {
  const rotationId = defaultRotationForClass(classId)?.id
  const build = graduationBuildsFor(classId).find(
    (candidate) => candidate.rotationId === rotationId,
  )!
  return withDerivedStats(
    graduationInputs(
      { ...defaultInputs, classId, graduationBuildId: build.id, breakthrough },
      "maxRolls",
    )!,
  )
}

const sourcesOf = (inputs: Inputs) => buildScalingSources(inputs, equippedPiecesFor(inputs))

describe("an attack-scaled class talent reads the attribute attack before Formless", () => {
  it("leaves the talent-board and gear Formless attack out of the primary attribute's source", () => {
    const umbra = graduated("bellstrikeUmbra", 21)
    const sources = sourcesOf(umbra)
    expect(umbra.formlessAttack).toEqual({ min: 26.4, max: 26.4 })
    expect(sources["bellstrike.max"]).toBeCloseTo(umbra.bellstrike.max - 26.4, 9)
    expect(sources["bellstrike.min"]).toBeCloseTo(umbra.bellstrike.min - 26.4, 9)
  })

  it("scales Bellstrike Penetration and Bellstrike DMG Bonus from 863 Max Bellstrike Attack at breakthrough 21", () => {
    const umbra = graduated("bellstrikeUmbra", 21)
    expect(sourcesOf(umbra)["bellstrike.max"]).toBeCloseTo(863, 9)
    expect(umbra.bellstrike.penetration).toBeCloseTo(0.289968, 12)
    expect(umbra.attributeDamageBoost).toBeCloseTo(0.144984, 12)
  })

  it("scales the Bamboocut talents from Min Bamboocut Attack before Formless at breakthrough 21", () => {
    const draught = graduated("bamboocutDraught", 21)
    expect(sourcesOf(draught)["bamboocut.min"]).toBeCloseTo(draught.bamboocut.min - 26.4, 9)
    expect(draught.bamboocut.penetration).toBeCloseTo(0.289632, 12)
    expect(draught.attributeDamageBoost).toBeCloseTo(0.144816, 12)
  })

  it("keeps a capped talent at its cap at breakthrough 18", () => {
    const umbra = graduated("bellstrikeUmbra", 18)
    expect(umbra.bellstrike.penetration).toBeCloseTo(0.236, 12)
    expect(umbra.attributeDamageBoost).toBeCloseTo(0.118, 12)
  })

  it("reads physical attack and the other attribute tracks unchanged", () => {
    const umbra = graduated("bellstrikeUmbra", 21)
    const sources = sourcesOf(umbra)
    expect(sources["phys.max"]).toBe(umbra.phys.max)
    expect(sources["phys.min"]).toBe(umbra.phys.min)
    expect(sources["stonesplit.max"]).toBe(umbra.stonesplit.max)
    expect(sources["bamboocut.min"]).toBe(umbra.bamboocut.min)
  })
})
