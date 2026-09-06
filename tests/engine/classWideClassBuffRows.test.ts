// Scoped to Bamboocut Draught's own class buffs — the class carries no
// validated anchor (docs/TESTING.md § "Class scoping"), so nothing here
// asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { alwaysActiveClassBuffs } from "../../src/engine/buffs/catalog"
import { defaultInputs } from "../../src/engine/defaults"
import { BUFF } from "../../src/data/skills/buffs/ids"

describe("class-wide class buff rows", () => {
  it("a class-wide class buff is listed on the talents tab", () => {
    const rows = alwaysActiveClassBuffs({ ...defaultInputs, classId: "bamboocutDraught" })
    const ids = rows.map((row) => row.id)
    expect(ids).toContain(BUFF.inebriateSkillCritDamage)
    expect(ids).toContain(BUFF.inebriateDamageScaling)
  })
})
