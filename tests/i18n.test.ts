import { describe, expect, it } from "vitest"
import { translate } from "../src/i18n/translations"

describe("translate", () => {
  it("falls back to the input when no translation exists (en)", () => {
    expect(translate("Phys", "en")).toBe("Phys")
    expect(translate("DPS", "en")).toBe("DPS")
    expect(translate("Graduation %", "en")).toBe("Graduation %")
    expect(translate("__unknown__", "en")).toBe("__unknown__")
  })

  it("passes already-English built-in skill names through unchanged", async () => {
    const { builtinSkillsForClass } = await import("../src/engine/builtinLibrary")
    const skills = builtinSkillsForClass("bellstrikeUmbra")
    expect(skills.length).toBeGreaterThan(0)
    for (const s of skills) {
      expect(translate(s.name, "en")).toBe(s.name)
    }
  })
})
