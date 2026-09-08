import { describe, expect, it } from "vitest"
import { selectableGearLevels } from "../../src/ui/features/gear/shared/selectableGearLevels"

describe("selectableGearLevels", () => {
  it("offers only the levels the breakthrough has reached", () => {
    expect(selectableGearLevels(17, 96)).toEqual([86, 91, 96])
    expect(selectableGearLevels(18, 96)).toEqual([86, 91, 96, 100])
  })

  it("keeps a piece's own level selectable even when the breakthrough no longer reaches it", () => {
    expect(selectableGearLevels(17, 105)).toEqual([86, 91, 96, 105])
  })

  it("never drops a level, so an out-of-reach piece stays editable", () => {
    for (const breakthrough of [12, 15, 17, 18, 21]) {
      for (const current of [86, 91, 96, 100, 105] as const) {
        expect(selectableGearLevels(breakthrough, current)).toContain(current)
      }
    }
  })

  it("returns the levels in ascending order", () => {
    const levels = selectableGearLevels(13, 105)
    expect(levels).toEqual([...levels].sort((left, right) => left - right))
  })
})
