// docs/TIMELINE.md § "Qi bar" — the rotation's authored `qiBreak` seeds the
// simulated schedule and stays available as manual mode; this pins how close
// the two stay for every built-in rotation, in a graduation-level build.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { graduationBuildsFor } from "../../src/definitions/graduationBuilds/registry"
import { graduationInputs } from "../../src/engine/graduation"

const TOLERANCE_SEC = 8

// Rotations the tolerance band deliberately excludes, with the reason:
// in-game observation as of 2026-09-25, Splendor's authored break reads
// 10-12 s late on every one of its rotations (the class fills the bar at
// ~34 Qi/s from the first second; the shared 34 s window looks copied from
// another class rather than observed for Splendor), and Jade's shortest
// rotation deals too little damage in a graduation-level build to ever
// reach a break at all. `standardized-1-7` moves far earlier as of
// 2026-09-30: its fixed hit-count drone modules were missing the
// Lingering-Bone extra-bullet mechanic (`additionalTicks`) the default drone
// debuff already carried, nearly doubling this rotation's drone hit count —
// the authored break predates that fix.
const KNOWN_OUTLIERS = new Set([
  "builtin-bellstrikeSplendor-60s-78-waves-2-flute-1-frog",
  "builtin-bellstrikeSplendor-crylis-44vs-full-waves",
  "builtin-bellstrikeSplendor-kaezuma-42vs-1db",
  "builtin-silkbindJade-30s-dummy-max",
  "builtin-silkbindJade-standardized-1-7",
])

const CASES = CLASS_IDS().flatMap((classId) => {
  const [firstBuild] = graduationBuildsFor(classId)
  if (!firstBuild) return []
  return builtinRotationsForClass(classId)
    .filter((rotation) => rotation.qiBreak && !KNOWN_OUTLIERS.has(rotation.id))
    .map((rotation) => [classId, firstBuild.id, rotation.id, rotation.qiBreak!.startSec] as const)
})

describe.each(CASES)(
  "%s's %s rotation %s computed first break",
  (classId, graduationBuildId, rotationId, authoredStartSec) => {
    it(`stays within ${TOLERANCE_SEC}s of the authored ${authoredStartSec}s`, () => {
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
      const computedStartSec = result.qiBreaks?.[0]?.startSec
      expect(computedStartSec, "expected a first break").toBeDefined()
      expect(Math.abs(computedStartSec! - authoredStartSec)).toBeLessThanOrEqual(TOLERANCE_SEC)
    })
  },
)

it("covers a non-trivial number of built-in rotations, so the sweep cannot pass vacuously", () => {
  expect(CASES.length).toBeGreaterThanOrEqual(10)
})
