import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ClassSelect } from "../../src/ui/features/overview/class-select/ClassSelect"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"

describe("ClassSelect", () => {
  it("offers every class the barrel defines, whether or not its numbers are pinned", () => {
    render(
      <I18nProvider>
        <ClassSelect value={CLASS_DEFS()[0].id} onChange={() => {}} />
      </I18nProvider>,
    )
    fireEvent.click(screen.getByRole("combobox"))
    const offered = screen.getAllByRole("option").map((option) => option.textContent ?? "")
    expect(offered).toHaveLength(CLASS_DEFS().length)
    CLASS_DEFS().forEach((classDef, index) => {
      expect(offered[index]).toContain(classDef.displayName)
    })
  })
})
