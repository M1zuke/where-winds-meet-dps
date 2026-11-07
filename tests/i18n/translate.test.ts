import { describe, expect, it, vi } from "vitest"
import { isLocale, translate } from "../../src/i18n/translations"

vi.mock("../../src/i18n/locales/ko.json", () => ({
  default: { "common.save": "translated", "common.cancel": "" },
}))

describe("translate", () => {
  it("renders the English catalogue entry for the English locale", () => {
    expect(translate("common.save", "en")).toBe("Save")
  })

  it("renders a locale's own entry once it carries one", () => {
    expect(translate("common.save", "ko")).toBe("translated")
  })

  it("falls through to English while a locale's entry is empty", () => {
    expect(translate("common.cancel", "ko")).toBe("Cancel")
  })

  it("renders the caller's fallback for a key no catalogue carries", () => {
    expect(translate("content.skill.authored-by-a-user", "ko", "My Skill")).toBe("My Skill")
    expect(translate("content.skill.authored-by-a-user", "en", "My Skill")).toBe("My Skill")
  })

  it("renders the key itself when nothing else answers", () => {
    expect(translate("nowhere.at.all", "en")).toBe("nowhere.at.all")
    expect(translate("nowhere.at.all", "ko")).toBe("nowhere.at.all")
  })

  it("accepts only the locales the app ships a catalogue for", () => {
    expect(isLocale("en")).toBe(true)
    expect(isLocale("ko")).toBe(true)
    expect(isLocale("zh")).toBe(false)
    expect(isLocale(null)).toBe(false)
  })
})
