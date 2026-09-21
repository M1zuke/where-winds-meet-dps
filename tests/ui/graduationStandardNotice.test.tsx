import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { StandardizedEncounter } from "../../src/definitions/graduationBuilds/graduationBuildDef"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { GraduationStandardNotice } from "../../src/ui/features/gear/graduation-standard-notice/GraduationStandardNotice"

function renderNotice(encounter: Partial<StandardizedEncounter> | undefined) {
  render(
    <I18nProvider>
      <GraduationStandardNotice encounter={encounter} />
    </I18nProvider>,
  )
  return screen.getByText("Standardized benchmark").parentElement!
}

describe("GraduationStandardNotice", () => {
  it("names every encounter setting the standard turns on and says the rest are off", () => {
    const notice = renderNotice({ food: true, script: "voidrotScript", divinecraft: "fire" })

    expect(notice).toHaveTextContent(
      "Simmering Fish Slices (Food), Voidrot Script, Divinecraft: Fire Oil — everything else off",
    )
    expect(notice).not.toHaveTextContent("Enable Dummy")
    expect(notice).not.toHaveTextContent("Healer Buff")
  })

  it("says everything is off when the standard turns nothing on", () => {
    expect(renderNotice(undefined)).toHaveTextContent("everything off")
  })
})
