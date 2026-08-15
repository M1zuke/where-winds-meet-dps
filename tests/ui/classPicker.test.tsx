import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ClassPicker } from "../../src/ui/features/setup/class-picker/ClassPicker"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { CLASS_DEFS, classDefinition } from "../../src/definitions/classes/registry"
import { GITHUB_REPO_URL } from "../../src/ui/layout/github-link/GithubLink"

describe("ClassPicker", () => {
  it("offers one tile per registered class, and each names its martial arts", () => {
    render(
      <I18nProvider>
        <ClassPicker value={CLASS_DEFS()[0].id} onChange={() => {}} />
      </I18nProvider>,
    )

    const tiles = screen.getAllByRole("button")
    expect(tiles).toHaveLength(CLASS_DEFS().length)

    for (const classDef of CLASS_DEFS()) {
      const martialArts = classDefinition(classDef.id)!.martialArts
      const tile = screen.getByRole("button", {
        name: new RegExp(classDef.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      })
      for (const martialArt of martialArts) {
        expect(tile).toHaveTextContent(martialArt.name)
      }
    }
  })

  it("clicking a tile reports that class's id", () => {
    const onChange = vi.fn()
    const classDefs = CLASS_DEFS()
    render(
      <I18nProvider>
        <ClassPicker value={classDefs[0].id} onChange={onChange} />
      </I18nProvider>,
    )

    const target = classDefs[1]
    screen.getByRole("button", { name: new RegExp(target.displayName) }).click()
    expect(onChange).toHaveBeenCalledWith(target.id)
  })

  it("marks the selected class's tile as current", () => {
    const classDefs = CLASS_DEFS()
    render(
      <I18nProvider>
        <ClassPicker value={classDefs[0].id} onChange={() => {}} />
      </I18nProvider>,
    )

    const selectedTile = screen.getByRole("button", { name: new RegExp(classDefs[0].displayName) })
    expect(selectedTile).toHaveAttribute("aria-current", "true")

    const otherTile = screen.getByRole("button", { name: new RegExp(classDefs[1].displayName) })
    expect(otherTile).toHaveAttribute("aria-current", "false")
  })

  it("offers a link to the wiki for a missing class, not a selectable tile", () => {
    render(
      <I18nProvider>
        <ClassPicker value={CLASS_DEFS()[0].id} onChange={() => {}} />
      </I18nProvider>,
    )

    const helpLink = screen.getByRole("link")
    expect(helpLink).toHaveAttribute("href", `${GITHUB_REPO_URL}/wiki`)
    expect(helpLink).toHaveAttribute("target", "_blank")
    expect(helpLink).not.toHaveAttribute("aria-current")
    expect(screen.getAllByRole("button")).toHaveLength(CLASS_DEFS().length)
  })
})
