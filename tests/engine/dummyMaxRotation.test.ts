// Scoped to the unvalidated Jade preset: scheduling only, not a damage anchor.
import { it, expect } from "vitest"
import { builtinRotationsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { defaultInputs } from "../../src/engine/defaults"
import { simulateTimeline } from "../../src/engine/timeline"

it("resolves the 30-second preset, whose Dragon Head cast now lands past its own window", () => {
  const rotation = builtinRotationsForClass("silkbindJade").find(
    (value) => value.name === "30s Dummy max",
  )!
  const skills = builtinSkillsForClass("silkbindJade")
  for (const step of rotation.steps)
    expect(skills.some((skill) => skill.id === step.skillId)).toBe(true)
  const result = simulateTimeline({
    ...defaultInputs,
    classId: "silkbindJade",
    activeCustomRotation: rotation,
    buffParams: { blossomBarrage: true, blossomBarrageTier: 6 },
    // Manual mode: this preset's own authored break, so the scheduling
    // assertions below stay pinned to a known second.
    combatSettings: { ...defaultInputs.combatSettings!, qiBreakOverride: rotation.qiBreak! },
  })
  expect(result.resources?.[0].launches).toHaveLength(3)
  const finalLaunch = result.resources![0].launches[2]
  // Casts before the break now run longer under the corrected timings, so
  // the final launch starts after the break's own frozen start second
  // rather than straddling it.
  expect(finalLaunch.timeSec).toBeGreaterThanOrEqual(rotation.qiBreak!.startSec)
  expect(finalLaunch.endSec).toBeGreaterThan(rotation.qiBreak!.startSec)
  expect(finalLaunch.ticks).toBeGreaterThan(20)
  expect(result.rotationDuration).toBe(30)
  expect(result.castDuration).toBeGreaterThan(29.8)
  // The corrected timings run the rotation's own casts past its 30 s window;
  // the window itself still caps `rotationDuration` above.
  expect(result.castDuration).toBeGreaterThan(30)
  // The corrected timings still start this preset's Dragon Head - Plus cast
  // inside its own 30 s window, but its own long cast now carries the hit
  // past the window's own end, where it scores nothing.
  expect(result.casts?.some((cast) => cast.skillName === "Dragon Head - Plus")).toBe(true)
  expect(result.timeline?.some((event) => event.skillName === "Dragon Head - Plus")).toBe(false)
  expect(
    result.resources?.[0].launches.every(
      (launch) => launch.reason !== "insufficient" && launch.reason !== "recalled",
    ),
  ).toBe(true)
})
