// The counterpart to `buildEnablement.test.ts`: a few buffs are gated on a
// Combat Settings toggle rather than on the build, for states the simulation
// cannot derive. The toggle is global; the def it gates need not be.
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings } from "../../src/engine/types"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { BUFF } from "../../src/data/skills/buffs/ids"

describe("Below 60% Endurance", () => {
  it("takes its param from the setting alone", () => {
    const settings = { ...defaultCombatSettings(), lowEndurance: true }
    expect(paramsFromInputs({ ...defaultInputs, combatSettings: settings }).lowEndurance).toBe(true)
  })

  it("is off unless the setting says otherwise", () => {
    expect(defaultCombatSettings().lowEndurance).toBe(false)
    expect(paramsFromInputs({ ...defaultInputs }).lowEndurance).toBeUndefined()
  })

  it("is offered to the class that owns it and to no other", () => {
    const owners = CLASS_IDS().filter((classId) =>
      buffDefsForClass(classId).some((def) => def.id === BUFF.belowSixtyEndurance),
    )
    expect(owners).toEqual(["bellstrikeSplendor"])
  })
})
