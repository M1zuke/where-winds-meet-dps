import { describe, expect, it } from "vitest"
import {
  applyDisplacement,
  distanceReaderAtCast,
  isDisplacement,
  rootMotionMetersAt,
  type Displacement,
} from "../../src/engine/distance"
import { isHitVariant } from "../../src/engine/skill"

const forward: Displacement = {
  kind: "rootMotion",
  metersAtFrame: [
    [0, 0],
    [10, 0],
    [20, 4],
    [30, 5],
  ],
}
const forwardThrough: Displacement = { ...forward, throughTarget: true } as Displacement
const backward: Displacement = {
  kind: "rootMotion",
  metersAtFrame: [
    [0, 0],
    [30, -3],
  ],
}

describe("rootMotion displacement", () => {
  it("interpolates the metres linearly between keys and holds the ends", () => {
    const keys = (forward as Extract<Displacement, { kind: "rootMotion" }>).metersAtFrame
    expect(rootMotionMetersAt(keys, -5)).toBe(0)
    expect(rootMotionMetersAt(keys, 15)).toBeCloseTo(2, 9)
    expect(rootMotionMetersAt(keys, 25)).toBeCloseTo(4.5, 9)
    expect(rootMotionMetersAt(keys, 99)).toBe(5)
  })

  it.each([
    [3, 1],
    [7, 2],
    [12, 7],
  ])("stops at body contact: from %d m it leaves %d m", (startMeters, endMeters) => {
    expect(applyDisplacement(forward, startMeters)).toBeCloseTo(endMeters, 9)
  })

  it("never pushes a target already inside contact range away", () => {
    expect(applyDisplacement(forward, 0.4)).toBeCloseTo(0.4, 9)
  })

  it("passes through the target when marked throughTarget", () => {
    expect(applyDisplacement(forwardThrough, 3)).toBeCloseTo(2, 9)
    expect(applyDisplacement(forwardThrough, 7)).toBeCloseTo(2, 9)
    expect(applyDisplacement(forwardThrough, 12)).toBeCloseTo(7, 9)
  })

  it.each([3, 7, 12])(
    "a backward move grows the distance from %d m by its length",
    (startMeters) => {
      expect(applyDisplacement(backward, startMeters)).toBeCloseTo(startMeters + 3, 9)
    },
  )

  it("reads the metres at the given frame instead of the cast's end", () => {
    expect(applyDisplacement(forwardThrough, 12, 15)).toBeCloseTo(10, 9)
    expect(applyDisplacement(forward, 12, 20)).toBeCloseTo(8, 9)
  })

  it("is accepted as a byDistance band value and as its fallback", () => {
    const banded: Displacement = {
      kind: "byDistance",
      bands: [{ minMeters: 6, maxMeters: 9, then: forwardThrough }],
      otherwise: forward,
    }
    expect(applyDisplacement(banded, 7)).toBeCloseTo(2, 9)
    expect(applyDisplacement(banded, 12)).toBeCloseTo(7, 9)
    expect(applyDisplacement(banded, 12, 15)).toBeCloseTo(10, 9)
    expect(isDisplacement(banded)).toBe(true)
  })

  it("lets a cast reader ask for the distance at any frame after the approach", () => {
    const reader = distanceReaderAtCast({ displacement: forward, reachMeters: 3 }, 3, 3, 3)
    expect(reader(15)).toBeCloseTo(1, 9)
    expect(reader(Infinity)).toBeCloseTo(1, 9)
    const farReader = distanceReaderAtCast({ displacement: forwardThrough }, 20, 12, 12)
    expect(farReader(15)).toBeCloseTo(10, 9)
    expect(farReader(Infinity)).toBeCloseTo(7, 9)
  })

  it("validates the key list and the through-target flag", () => {
    expect(isDisplacement(forward)).toBe(true)
    expect(isDisplacement(forwardThrough)).toBe(true)
    expect(isDisplacement({ kind: "rootMotion", metersAtFrame: [] })).toBe(false)
    expect(isDisplacement({ kind: "rootMotion", metersAtFrame: [[0, 0], [5]] })).toBe(false)
    expect(
      isDisplacement({
        kind: "rootMotion",
        metersAtFrame: [
          [5, 0],
          [1, 1],
        ],
      }),
    ).toBe(false)
    expect(isDisplacement({ kind: "rootMotion", metersAtFrame: [[0, Number.NaN]] })).toBe(false)
    expect(
      isDisplacement({ kind: "rootMotion", metersAtFrame: [[0, 0]], throughTarget: "yes" }),
    ).toBe(false)
  })

  it("lets a hit variant carry its own displacement", () => {
    const variant = {
      id: "variant",
      label: "Form",
      conditions: [],
      physMultiplier: 1,
      attributeMultiplier: 1,
      physFixed: 0,
      attributeFixed: 0,
      displacement: forward,
    }
    expect(isHitVariant(variant)).toBe(true)
    expect(
      isHitVariant({ ...variant, displacement: { kind: "rootMotion", metersAtFrame: [] } }),
    ).toBe(false)
  })
})
