import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { ChangelogEntryDetails } from "../../src/changelog/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"

const newestDetails: ChangelogEntryDetails = {
  sections: [
    { label: "Added", items: [{ text: "the newest thing", authors: ["SomeContributor"] }] },
  ],
}
const olderDetails: ChangelogEntryDetails = {
  sections: [
    {
      label: "Fixed",
      items: [{ text: "the older thing", authors: ["FirstAuthor", "SecondAuthor"] }],
    },
  ],
}

const loadNewest = vi.fn(() => Promise.resolve(newestDetails))
const loadOlder = vi.fn(() => Promise.resolve(olderDetails))

vi.mock("../../src/changelog/registry", () => ({
  CHANGELOG_ENTRIES: [
    {
      version: "9.9.9",
      date: "2026-08-13",
      headline: "Newest release",
      loadDetails: () => loadNewest(),
    },
    {
      version: "9.9.8",
      date: "2026-08-12",
      headline: "Older release",
      loadDetails: () => loadOlder(),
    },
  ],
}))

const { ChangelogDialog } = await import("../../src/ui/layout/changelog-dialog/ChangelogDialog")

function renderDialog(onClose = () => {}) {
  return render(
    <I18nProvider>
      <ChangelogDialog onClose={onClose} />
    </I18nProvider>,
  )
}

describe("ChangelogDialog", () => {
  beforeEach(() => {
    localStorage.clear()
    loadNewest.mockClear()
    loadOlder.mockClear()
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })),
    )
  })

  it("lists every version and shows the newest one without a click", async () => {
    renderDialog()
    expect(screen.getByRole("button", { name: /9\.9\.9/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /9\.9\.8/ })).toBeInTheDocument()
    expect(await screen.findByText("the newest thing")).toBeInTheDocument()
  })

  it("loads only the selected version's content", async () => {
    renderDialog()
    await screen.findByText("the newest thing")
    expect(loadNewest).toHaveBeenCalledTimes(1)
    expect(loadOlder).not.toHaveBeenCalled()
  })

  it("marks the shown version as the current one in the list", async () => {
    renderDialog()
    await screen.findByText("the newest thing")
    expect(screen.getByRole("button", { name: /9\.9\.9/ })).toHaveAttribute("aria-current", "true")
  })

  it("shows another version's content when it is selected", async () => {
    renderDialog()
    await screen.findByText("the newest thing")
    fireEvent.click(screen.getByRole("button", { name: /9\.9\.8/ }))
    expect(await screen.findByText("the older thing")).toBeInTheDocument()
    expect(screen.queryByText("the newest thing")).not.toBeInTheDocument()
    expect(loadOlder).toHaveBeenCalledTimes(1)
  })

  it("reuses already loaded content when a version is selected again", async () => {
    renderDialog()
    await screen.findByText("the newest thing")
    fireEvent.click(screen.getByRole("button", { name: /9\.9\.8/ }))
    await screen.findByText("the older thing")
    fireEvent.click(screen.getByRole("button", { name: /9\.9\.9/ }))
    await screen.findByText("the newest thing")
    expect(loadNewest).toHaveBeenCalledTimes(1)
    expect(loadOlder).toHaveBeenCalledTimes(1)
  })

  it("closes on Escape, on a backdrop click and through the close button", async () => {
    const onClose = vi.fn()
    const { unmount } = renderDialog(onClose)
    await screen.findByText("the newest thing")

    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onClose).toHaveBeenCalledTimes(2)

    fireEvent.mouseDown(screen.getByRole("dialog"))
    expect(onClose).toHaveBeenCalledTimes(3)
    unmount()
  })

  it("credits each change to its author, linking to that profile", async () => {
    renderDialog()
    await screen.findByText("the newest thing")
    const authorLinks = screen.getAllByRole("link", { name: "SomeContributor" })
    expect(authorLinks[0]).toHaveAttribute("href", "https://github.com/SomeContributor")
    expect(screen.getByText("done by")).toBeInTheDocument()
  })

  it("credits every author when a change took more than one person", async () => {
    renderDialog()
    await screen.findByText("the newest thing")
    fireEvent.click(screen.getByRole("button", { name: /9\.9\.8/ }))
    await screen.findByText("the older thing")
    expect(screen.getByRole("link", { name: "FirstAuthor" })).toHaveAttribute(
      "href",
      "https://github.com/FirstAuthor",
    )
    expect(screen.getByRole("link", { name: "SecondAuthor" })).toHaveAttribute(
      "href",
      "https://github.com/SecondAuthor",
    )
  })

  it("keeps the version list and the shown version side by side in one view", async () => {
    renderDialog()
    await screen.findByText("the newest thing")
    expect(screen.getByRole("button", { name: /9\.9\.8/ })).toBeInTheDocument()
    expect(screen.getByText("the newest thing")).toBeInTheDocument()
  })
})
