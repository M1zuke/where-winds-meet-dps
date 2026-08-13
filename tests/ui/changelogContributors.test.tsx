import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { APP_VERSION } from "../../src/appVersion"

const CONTRIBUTOR_PAYLOAD = [
  {
    login: "SomeContributor",
    avatar_url: "https://avatars.example/1.png",
    html_url: "https://github.com/SomeContributor",
    type: "User",
  },
  {
    login: "SomeBot",
    avatar_url: "https://avatars.example/2.png",
    html_url: "https://github.com/SomeBot",
    type: "Bot",
  },
]

function stubFetch(implementation: () => Promise<unknown>) {
  const fetchMock = vi.fn(implementation)
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function respondWith(payload: unknown) {
  return () => Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })
}

async function renderContributors() {
  vi.resetModules()
  const { ChangelogContributors } =
    await import("../../src/ui/layout/changelog-contributors/ChangelogContributors")
  return render(
    <I18nProvider>
      <ChangelogContributors />
    </I18nProvider>,
  )
}

describe("ChangelogContributors", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("links each avatar to that contributor's profile", async () => {
    stubFetch(respondWith(CONTRIBUTOR_PAYLOAD))
    await renderContributors()
    const profileLink = await screen.findByRole("link", { name: "SomeContributor" })
    expect(profileLink).toHaveAttribute("href", "https://github.com/SomeContributor")
    expect(profileLink).toHaveAttribute("target", "_blank")
  })

  it("leaves bot accounts out of the list", async () => {
    stubFetch(respondWith(CONTRIBUTOR_PAYLOAD))
    await renderContributors()
    await screen.findByRole("link", { name: "SomeContributor" })
    expect(screen.queryByRole("link", { name: "SomeBot" })).not.toBeInTheDocument()
  })

  it("caches the list under the current version so a second visit makes no request", async () => {
    const firstFetch = stubFetch(respondWith(CONTRIBUTOR_PAYLOAD))
    await renderContributors()
    await screen.findByRole("link", { name: "SomeContributor" })
    expect(firstFetch).toHaveBeenCalledTimes(1)

    const secondFetch = stubFetch(respondWith(CONTRIBUTOR_PAYLOAD))
    await renderContributors()
    await screen.findByRole("link", { name: "SomeContributor" })
    expect(secondFetch).not.toHaveBeenCalled()
  })

  it("refetches once the cached list belongs to an older version", async () => {
    localStorage.setItem(
      "wwm.contributors",
      JSON.stringify({
        version: "0.0.1",
        contributors: [
          {
            login: "StaleContributor",
            avatarUrl: "https://avatars.example/9.png",
            profileUrl: "https://github.com/StaleContributor",
          },
        ],
      }),
    )
    const fetchMock = stubFetch(respondWith(CONTRIBUTOR_PAYLOAD))
    await renderContributors()
    await screen.findByRole("link", { name: "SomeContributor" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem("wwm.contributors")).toContain(APP_VERSION)
  })

  it("falls back to the cached list when GitHub cannot be reached", async () => {
    localStorage.setItem(
      "wwm.contributors",
      JSON.stringify({
        version: "0.0.1",
        contributors: [
          {
            login: "CachedContributor",
            avatarUrl: "https://avatars.example/8.png",
            profileUrl: "https://github.com/CachedContributor",
          },
        ],
      }),
    )
    stubFetch(() => Promise.reject(new Error("offline")))
    await renderContributors()
    expect(await screen.findByRole("link", { name: "CachedContributor" })).toBeInTheDocument()
  })

  it("renders nothing when GitHub cannot be reached and nothing is cached", async () => {
    stubFetch(() => Promise.reject(new Error("offline")))
    await renderContributors()
    await waitFor(() => expect(screen.queryByText("Contributors")).not.toBeInTheDocument())
  })

  it("ignores a cache entry that is not shaped like a contributor list", async () => {
    localStorage.setItem("wwm.contributors", "not json")
    const fetchMock = stubFetch(respondWith(CONTRIBUTOR_PAYLOAD))
    await renderContributors()
    await screen.findByRole("link", { name: "SomeContributor" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
