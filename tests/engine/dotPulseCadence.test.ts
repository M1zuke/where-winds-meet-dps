import { expect, it } from "vitest"
import { makeDebuff } from "../../src/engine/debuff"
import { dotTicksPerWindow, planDotTicks } from "../../src/engine/dot"

it("schedules each pulse impact separately and clips the trailing impact at the window end", () => {
  const debuff = makeDebuff("fictional", {
    durationFrames: 85,
    dot: {
      tickIntervalFrames: 40,
      firstTickOffsetFrames: 5,
      additionalTicks: { offsetsFrames: [12], requiresBuff: "fictional-mark" },
      physMultiplier: 1,
      physFixed: 0,
      attributeMultiplier: 0,
      attributeFixed: 0,
      attributeAttack: "",
      skillType: "sustain",
      count: 1,
    },
  })
  const plan = (end: number) =>
    planDotTicks({
      debuff,
      dot: debuff.dot!,
      windows: [{ start: 0, end }],
      stacksAt: () => 1,
      inWindow: (frame) => frame < end,
      weightAt: (frame) => (frame < 40 ? 0.5 : 1),
    })
  expect(plan(85).map(({ frame }) => frame)).toEqual([5, 17, 45, 57])
  expect(plan(55).map(({ frame }) => frame)).toEqual([5, 17, 45])
  expect(plan(85).map(({ weight }) => weight)).toEqual([0.5, 0.5, 1, 1])
  expect(plan(85).map(({ requiresBuff }) => requiresBuff)).toEqual([
    undefined,
    "fictional-mark",
    undefined,
    "fictional-mark",
  ])
  expect(dotTicksPerWindow(debuff)).toBe(2)
})
