import { beforeEach, describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fireEvent, render, screen } from "@testing-library/react"
import { ChangelogButton } from "../../src/ui/layout/changelog-button/ChangelogButton"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { APP_VERSION } from "../../src/appVersion"
import { CHANGELOG_ENTRIES } from "../../src/changelog/registry"

function renderButton() {
  return render(
    <I18nProvider>
      <ChangelogButton />
    </I18nProvider>,
  )
}

describe("ChangelogButton", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders a button whose accessible name contains the app version", () => {
    renderButton()
    expect(screen.getByRole("button", { name: new RegExp(APP_VERSION) })).toBeInTheDocument()
  })

  it("shows the New marker with empty storage", () => {
    renderButton()
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("hides the New marker when the current version is stored", () => {
    localStorage.setItem("wwm.lastSeenVersion", APP_VERSION)
    renderButton()
    expect(screen.queryByText("New")).not.toBeInTheDocument()
  })

  it("shows the New marker when an older version is stored", () => {
    localStorage.setItem("wwm.lastSeenVersion", "0.0.1")
    renderButton()
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("records no last-seen version until the changelog is opened", () => {
    renderButton()
    expect(localStorage.getItem("wwm.lastSeenVersion")).toBeNull()
  })

  it("keeps the New marker across visits while the changelog stays unopened", () => {
    renderButton().unmount()
    renderButton()
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("records the current version as the last-seen version once opened", () => {
    renderButton()
    fireEvent.click(screen.getByRole("button", { name: new RegExp(APP_VERSION) }))
    expect(localStorage.getItem("wwm.lastSeenVersion")).toBe(APP_VERSION)
  })

  it("shows no dialog until clicked, then opens one listing the newest entry", async () => {
    renderButton()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: new RegExp(APP_VERSION) }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent(CHANGELOG_ENTRIES[0].version)
  })

  it("clears the New marker on click", () => {
    renderButton()
    expect(screen.getByText("New")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: new RegExp(APP_VERSION) }))
    expect(screen.queryByText("New")).not.toBeInTheDocument()
  })

  it("reaches the dialog only through a dynamic import, never a static one", () => {
    const source = readFileSync(
      join(process.cwd(), "src/ui/layout/changelog-button/ChangelogButton.tsx"),
      "utf8",
    )
    expect(source).not.toMatch(/from\s+["'][^"']*ChangelogDialog["']/)
    expect(source).not.toMatch(/from\s+["'][^"']*changelog\/registry["']/)
    expect(source).not.toMatch(/from\s+["'][^"']*changelog\/entries/)
    expect(source).toMatch(/import\(["']\.\.\/changelog-dialog\/ChangelogDialog["']\)/)
  })
})
