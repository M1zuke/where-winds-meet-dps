import { describe, expect, it } from "vitest"
import { wizardSteps } from "../../src/ui/features/setup/setup-wizard/wizardSteps"

describe("wizardSteps", () => {
  it("skips the graduation build step for a class with a single build", () => {
    expect(wizardSteps(1, false)).toEqual(["class", "import"])
  })

  it("asks for the graduation build after the gear import", () => {
    expect(wizardSteps(2, false)).toEqual(["class", "import", "graduation"])
  })

  it("asks for it last on the manual path, after the profile name", () => {
    expect(wizardSteps(1, true)).toEqual(["class", "import", "name"])
    expect(wizardSteps(3, true)).toEqual(["class", "import", "name", "graduation"])
  })
})
