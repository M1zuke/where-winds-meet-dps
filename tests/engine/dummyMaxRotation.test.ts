// Scoped to the unvalidated Jade preset: scheduling only, not a damage anchor.
import { it, expect } from "vitest"
import { builtinRotationsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { defaultInputs } from "../../src/engine/defaults"
import { simulateTimeline } from "../../src/engine/timeline"

it("resolves the 30-second preset, whose Dragon Head cast runs past its own window", () => {
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
  })
  expect(result.resources?.[0].launches).toHaveLength(3)
  const finalLaunch = result.resources![0].launches[2]
  expect(finalLaunch.ticks).toBe(19)
  expect(result.rotationDuration).toBe(30)
  expect(result.castDuration).toBeGreaterThan(30)
  // Its own long cast carries the Dragon Head - Plus hit past the window's
  // own end, where it scores nothing.
  expect(result.casts?.some((cast) => cast.skillName === "Dragon Head - Plus")).toBe(true)
  expect(result.timeline?.some((event) => event.skillName === "Dragon Head - Plus")).toBe(false)
  expect(
    result.resources?.[0].launches.every(
      (launch) => launch.reason !== "insufficient" && launch.reason !== "recalled",
    ),
  ).toBe(true)
})
