// docs/TIMELINE.md § "Qi bar" — the fixed-point iteration over the break
// frames must settle, on every built-in rotation, within the cap.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { graduationBuildsFor } from "../../src/definitions/graduationBuilds/registry"
import { graduationInputs } from "../../src/engine/graduation"

const CASES = CLASS_IDS().flatMap((classId) => {
  const [firstBuild] = graduationBuildsFor(classId)
  if (!firstBuild) return []
  return builtinRotationsForClass(classId).map(
    (rotation) => [classId, firstBuild.id, rotation.id] as const,
  )
})

describe.each(CASES)(
  "%s's %s rotation %s converges within the cap",
  (classId, graduationBuildId, rotationId) => {
    it("settles on a stable break schedule with no convergence warning", () => {
      const base = graduationInputs({
        ...defaultInputs,
        classId,
        graduationBuildId,
        breakthrough: 17,
      })!
      const inputs = withDerivedStats({
        ...base,
        selectedBuiltinRotationId: rotationId,
        activeCustomRotation: null,
      })
      const result = runEngine(applyBowSet(applyArmorSet(inputs)))
      expect(result.warnings.some((warning) => warning.includes("did not converge"))).toBe(false)
    })
  },
)

it("covers a non-trivial number of built-in rotations, so the sweep cannot pass vacuously", () => {
  expect(CASES.length).toBeGreaterThanOrEqual(10)
})
