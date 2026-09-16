import { describe, expect, it } from "vitest"
import { wizardSteps } from "../../src/ui/features/setup/setup-wizard/wizardSteps"

describe("wizardSteps", () => {
  it("skips the graduation build step for a class with a single build", () => {
    expect(wizardSteps(1, false)).toEqual(["class", "import"])
  })

  it("asks for the graduation build right after the class when the class has several", () => {
    expect(wizardSteps(2, false)).toEqual(["class", "graduation", "import"])
  })

  it("adds the name step only on the manual path", () => {
    expect(wizardSteps(1, true)).toEqual(["class", "import", "name"])
    expect(wizardSteps(3, true)).toEqual(["class", "graduation", "import", "name"])
  })
})
