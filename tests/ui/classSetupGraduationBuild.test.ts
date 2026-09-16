import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { defaultInputs } from "../../src/engine/defaults"
import { syncClassPermanent } from "../../src/ui/utils/classSetup"

describe("syncClassPermanent — the followed graduation build", () => {
  it("keeps the followed build while the class stays the same", () => {
    const inputs = { ...defaultInputs, graduationBuildId: "a-build-this-profile-follows" }

    expect(syncClassPermanent(inputs, inputs.classId).graduationBuildId).toBe(
      "a-build-this-profile-follows",
    )
  })

  it("drops the previous class's choice and takes the new class's only build", () => {
    const [umbraBuild] = classDefinition("bellstrikeUmbra")!.graduationBuilds
    const [stonesplitBuild] = classDefinition("stonesplitStrength")!.graduationBuilds
    const inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      graduationBuildId: umbraBuild.id,
    }

    expect(syncClassPermanent(inputs, "stonesplitStrength").graduationBuildId).toBe(
      stonesplitBuild.id,
    )
  })
})
