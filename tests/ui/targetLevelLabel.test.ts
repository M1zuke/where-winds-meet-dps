import { describe, expect, it } from "vitest"
import { targetLevelLabel } from "../../src/ui/features/gear/shared/targetLevelLabel"

describe("targetLevelLabel", () => {
  it("names the gear level a figure is measured at when it is not the piece's own", () => {
    expect(targetLevelLabel("FP", 96, 100)).toBe("FP → lv100")
  })

  it("keeps the plain label when the figure is measured at the piece's own level", () => {
    expect(targetLevelLabel("FP", 100, 100)).toBe("FP")
  })

  it("keeps the plain label while the level is still being computed", () => {
    expect(targetLevelLabel("Max (94%)", 96, undefined)).toBe("Max (94%)")
  })
})
