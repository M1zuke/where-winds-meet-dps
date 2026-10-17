// Refactor guard, NOT a correctness anchor — docs/TESTING.md § "Locked
// fixtures assert unchanged, never right". The Qi bar is scripted to each
// rotation's converged breaks, so a moved figure is purely an ordering effect.
// Regenerate with UPDATE_ROTATION_ORDER=1.
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { writeFixture } from "../writeFixture"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applySetBonuses } from "../../src/engine/setBonuses"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { graduationBuildsFor } from "../../src/definitions/graduationBuilds/registry"
import { graduationInputs } from "../../src/engine/graduation"
import { FPS } from "../../src/engine/timeline"

const FIXTURE_PATH = join(process.cwd(), "tests/engine/rotationOrder.fixture.json")
const REGENERATE = process.env.UPDATE_ROTATION_ORDER === "1"

type BreakFrames = readonly (readonly [startFrame: number, endFrame: number])[]

const CONVERGED_BREAK_FRAMES: Readonly<Record<string, BreakFrames>> = {
  "builtin-bellstrikeUmbra-36-bbs": [[1600, 2200]],
  "builtin-bellstrikeUmbra-36-bbs-2-dragon-breaths": [[1665, 2265]],
  "builtin-bellstrikeUmbra-38-bbs": [[1637, 2237]],
  "builtin-bellstrikeUmbra-nox-1m-dh": [[1624, 2224]],
  "builtin-bellstrikeUmbra-nox-30s-dh": [[1680, 2280]],
  "builtin-stonesplitStrength-tilla-dummy-rotation": [[1822, 2422]],
  "builtin-stonesplitStrength-windsfromcn-switch": [[1486, 2086]],
  "builtin-stonesplitStrength-windsfromcn-switch-no-toad": [[1459, 2059]],
  "builtin-bellstrikeSplendor-60s-78-waves-2-flute-1-frog": [
    [1001, 1601],
    [3126, 3726],
  ],
  "builtin-bellstrikeSplendor-crylis-44vs-full-waves": [[1045, 1645]],
  "builtin-bellstrikeSplendor-kaezuma-42vs-1db": [[1120, 1720]],
  "builtin-silkbindJade-20-dh-video-60s": [[1707, 2307]],
  "builtin-silkbindJade-30s-dummy-max": [[1634, 2234]],
  "builtin-silkbindJade-standardized-1-7": [[1859, 2459]],
  "builtin-silkbindJade-t5": [[2215, 2815]],
  "builtin-bamboocutDraught-1m-dummy-windsfromcn": [[1508, 2108]],
}

interface RotationFigures {
  dps: number
  totalDamage: number
  damageBySkill: Record<string, number>
}

const BUILTIN_ROTATIONS = CLASS_IDS().flatMap((classId) =>
  builtinRotationsForClass(classId).map((rotation) => ({ classId, rotation })),
)

function figuresWithScriptedBreaks(classId: string, rotationId: string): RotationFigures {
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
  const result = runEngine(applySetBonuses(inputs), {
    fixedQiBreaks: CONVERGED_BREAK_FRAMES[rotationId].map(([startFrame, endFrame]) => ({
      startSec: startFrame / FPS,
      durationSec: (endFrame - startFrame) / FPS,
      lowQiLeadSec: 0,
    })),
  })
  return {
    dps: result.dps,
    totalDamage: result.totalDamage,
    damageBySkill: Object.fromEntries(
      result.perSkill.map((skill) => [skill.name, skill.expectedDamage]),
    ),
  }
}

const recorded: Record<string, RotationFigures> = {}
const stored: Record<string, RotationFigures> =
  !REGENERATE && existsSync(FIXTURE_PATH) ? JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) : {}

describe("every built-in rotation under its scripted converged Qi breaks", () => {
  it("pins a break for every built-in rotation and for nothing else", () => {
    expect(Object.keys(CONVERGED_BREAK_FRAMES).sort()).toEqual(
      BUILTIN_ROTATIONS.map(({ rotation }) => rotation.id).sort(),
    )
  })

  it.each(BUILTIN_ROTATIONS)("$rotation.id keeps its recorded figures", ({ classId, rotation }) => {
    const figures = figuresWithScriptedBreaks(classId, rotation.id)
    recorded[rotation.id] = figures
    if (REGENERATE) return
    expect(figures).toEqual(stored[rotation.id])
  })

  it.runIf(REGENERATE)("writes the fixture", async () => {
    await writeFixture(FIXTURE_PATH, recorded)
  })
})
