import { describe, expect, it } from "vitest"
import { isLocale, translate } from "../../src/i18n/translations"
import catalogue from "../../src/i18n/locales/ko.json"

describe("translate", () => {
  it("falls back to the input when no translation exists (en)", () => {
    expect(translate("Phys", "en")).toBe("Phys")
    expect(translate("DPS", "en")).toBe("DPS")
    expect(translate("Graduation %", "en")).toBe("Graduation %")
    expect(translate("__unknown__", "en")).toBe("__unknown__")
  })

  it("passes already-English built-in skill names through unchanged", async () => {
    const { builtinSkillsForClass } = await import("../../src/engine/builtinLibrary")
    const skills = builtinSkillsForClass("bellstrikeUmbra")
    expect(skills.length).toBeGreaterThan(0)
    for (const skill of skills) {
      expect(translate(skill.name, "en")).toBe(skill.name)
    }
  })

  it("shows the English source for every catalogue entry nobody has filled in yet", () => {
    const untranslated = Object.entries(catalogue as Record<string, string>)
      .filter(([, translation]) => translation === "")
      .map(([key]) => key)
    for (const key of untranslated) expect(translate(key, "ko")).toBe(key)
  })

  it("uses the catalogue entry once it carries a translation", () => {
    const translated = Object.entries(catalogue as Record<string, string>).find(
      ([, translation]) => translation !== "",
    )
    if (translated) expect(translate(translated[0], "ko")).toBe(translated[1])
  })

  it("accepts only the locales the app ships a dictionary for", () => {
    expect(isLocale("en")).toBe(true)
    expect(isLocale("ko")).toBe(true)
    expect(isLocale("zh")).toBe(false)
    expect(isLocale(null)).toBe(false)
  })
})
