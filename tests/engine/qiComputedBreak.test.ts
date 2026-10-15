import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { graduationBuildsFor } from "../../src/definitions/graduationBuilds/registry"
import { graduationInputs } from "../../src/engine/graduation"
import { qiScheduleSeedBreaksFrom } from "../../src/engine/qiBar"
import { FPS } from "../../src/engine/timeline"
import type { EngineRunOptions } from "../../src/engine/types"

type BreakFrames = readonly (readonly [startFrame: number, endFrame: number])[]

const COMPUTED_BREAK_FRAMES: Readonly<Record<string, BreakFrames>> = {
  "builtin-bellstrikeUmbra-36-bbs": [[1580, 2180]],
  "builtin-bellstrikeUmbra-36-bbs-2-dragon-breaths": [[1756, 2356]],
  "builtin-bellstrikeUmbra-38-bbs": [[1683, 2283]],
  "builtin-bellstrikeUmbra-nox-1m-dh": [[1618, 2218]],
  "builtin-bellstrikeUmbra-nox-30s-dh": [[1680, 2280]],
  "builtin-stonesplitStrength-tilla-dummy-rotation": [[1822, 2422]],
  "builtin-stonesplitStrength-windsfromcn-switch": [[1486, 2086]],
  "builtin-stonesplitStrength-windsfromcn-switch-no-toad": [[1459, 2059]],
  "builtin-bellstrikeSplendor-60s-78-waves-2-flute-1-frog": [
    [1003, 1603],
    [3132, 3732],
  ],
  "builtin-bellstrikeSplendor-crylis-44vs-full-waves": [[1047, 1647]],
  "builtin-bellstrikeSplendor-kaezuma-42vs-1db": [[1121, 1721]],
  "builtin-silkbindJade-20-dh-video-60s": [[1707, 2307]],
  "builtin-silkbindJade-30s-dummy-max": [[1634, 2234]],
  "builtin-silkbindJade-standardized-1-7": [[1859, 2459]],
  "builtin-silkbindJade-t5": [[2216, 2816]],
  "builtin-bamboocutDraught-1m-dummy-windsfromcn": [[1508, 2108]],
}

const BUILTIN_ROTATIONS = CLASS_IDS().flatMap((classId) =>
  builtinRotationsForClass(classId).map((rotation) => ({ classId, rotation })),
)

function graduationRun(
  classId: string,
  rotationId: string,
  options?: EngineRunOptions,
  rotationPatch?: Record<string, unknown>,
) {
  const [firstBuild] = graduationBuildsFor(classId)
  const base = graduationInputs({
    ...defaultInputs,
    classId,
    graduationBuildId: firstBuild.id,
    breakthrough: 17,
  })!
  const inputs = withDerivedStats({
    ...base,
    selectedBuiltinRotationId: rotationId,
    activeCustomRotation: null,
  })
  const withPatch = rotationPatch
    ? {
        ...inputs,
        activeCustomRotation: {
          ...builtinRotationsForClass(classId).find((rotation) => rotation.id === rotationId)!,
          ...rotationPatch,
        },
      }
    : inputs
  return runEngine(applyBowSet(applyArmorSet(withPatch)), options)
}

function breakFramesOf(result: { qiBreaks?: readonly { startSec: number; endSec: number }[] }) {
  return (result.qiBreaks ?? []).map((qiBreak) => [
    Math.round(qiBreak.startSec * FPS),
    Math.round(qiBreak.endSec * FPS),
  ])
}

describe("the computed Qi break of every built-in rotation", () => {
  it("is pinned for every built-in rotation and for nothing else", () => {
    expect(Object.keys(COMPUTED_BREAK_FRAMES).sort()).toEqual(
      BUILTIN_ROTATIONS.map(({ rotation }) => rotation.id).sort(),
    )
  })

  describe.each(BUILTIN_ROTATIONS)("$rotation.id", ({ classId, rotation }) => {
    const result = graduationRun(classId, rotation.id)

    it("lands on the pinned break frames", () => {
      expect(breakFramesOf(result)).toEqual(COMPUTED_BREAK_FRAMES[rotation.id])
    })

    it("converges without a warning", () => {
      expect(result.warnings.filter((warning) => warning.includes("Qi break"))).toEqual([])
    })

    it("reports its first break as the window the lane draws", () => {
      expect(result.qiBreakWindow?.startSec).toBe(result.qiBreaks![0].startSec)
      expect(result.qiBreakWindow?.endSec).toBe(result.qiBreaks![0].endSec)
    })
  })
})

describe("the computed Qi break does not depend on where the iteration starts", () => {
  const [{ classId, rotation }] = BUILTIN_ROTATIONS

  it("ignores a Qi break value stored on a custom rotation", () => {
    const stored = { qiBreak: { startSec: 5, durationSec: 10, lowQiLeadSec: 5 } }
    const withStoredValue = graduationRun(classId, rotation.id, undefined, stored)
    expect(breakFramesOf(withStoredValue)).toEqual(COMPUTED_BREAK_FRAMES[rotation.id])
  })

  it("reaches the same fixed point from a seed far from it", () => {
    const farSeed = qiScheduleSeedBreaksFrom([{ startSec: 3, endSec: 13 }], FPS)
    const seeded = graduationRun(classId, rotation.id, { qiScheduleSeedBreaks: farSeed })
    expect(breakFramesOf(seeded)).toEqual(COMPUTED_BREAK_FRAMES[rotation.id])
  })

  it("settles on its own result in one verifying run when seeded with it", () => {
    const converged = graduationRun(classId, rotation.id)
    const seeded = graduationRun(classId, rotation.id, {
      qiScheduleSeedBreaks: qiScheduleSeedBreaksFrom(converged.qiBreaks, FPS),
    })
    expect(seeded.qiIterations).toBe(1)
    expect(seeded.qiBreaks).toEqual(converged.qiBreaks)
  })
})
