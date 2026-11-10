import { describe, expect, it } from "vitest"
import { bladeVessel } from "../../src/data/skills/bamboocut-draught/blade-vessel"

const LOOP_START_FRAME = 34
const LOOP_PASS_FRAMES = 27.96
const FIRST_SLASH_OFFSET_FRAMES = 10.0
const SECOND_SLASH_OFFSET_FRAMES = 24.2
const HOLD_FRAMES = 96

describe("Blade Vessel's rapid slashes", () => {
  it("land twice per loop pass, for as long as the hold lasts", () => {
    const expected: number[] = []
    for (
      let pass = 0;
      LOOP_START_FRAME + pass * LOOP_PASS_FRAMES < LOOP_START_FRAME + HOLD_FRAMES;
      pass++
    )
      for (const offset of [FIRST_SLASH_OFFSET_FRAMES, SECOND_SLASH_OFFSET_FRAMES]) {
        const frame = LOOP_START_FRAME + pass * LOOP_PASS_FRAMES + offset
        if (frame < LOOP_START_FRAME + HOLD_FRAMES) expected.push(Math.round(frame))
      }
    const slashes = bladeVessel.hits.slice(1, 8).map((hit) => hit.frame)
    expect(slashes).toEqual(expected)
  })
})
