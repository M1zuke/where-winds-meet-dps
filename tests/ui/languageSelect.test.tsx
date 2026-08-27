import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { LanguageSelect } from "../../src/ui/layout/language-select/LanguageSelect"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { LOCALE_LABELS } from "../../src/i18n/translations"

function renderSelect() {
  return render(
    <I18nProvider>
      <LanguageSelect />
    </I18nProvider>,
  )
}

describe("LanguageSelect", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("opens on English and offers every locale the app ships a dictionary for", () => {
    renderSelect()
    expect(screen.getByRole("combobox")).toHaveTextContent(LOCALE_LABELS.en)
    fireEvent.click(screen.getByRole("combobox"))
    const offered = screen.getAllByRole("option").map((option) => option.textContent ?? "")
    expect(offered).toEqual(Object.values(LOCALE_LABELS))
  })

  it("remembers the chosen locale across a remount", () => {
    const { unmount } = renderSelect()
    fireEvent.click(screen.getByRole("combobox"))
    fireEvent.mouseDown(screen.getByRole("option", { name: LOCALE_LABELS.ko }))
    expect(localStorage.getItem("wwm.locale")).toBe("ko")
    unmount()

    renderSelect()
    expect(screen.getByRole("combobox")).toHaveTextContent(LOCALE_LABELS.ko)
  })
})
