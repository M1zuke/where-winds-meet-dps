import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { StandardizedEncounter } from "../../src/definitions/graduationBuilds/graduationBuildDef"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { GraduationStandardNotice } from "../../src/ui/features/gear/graduation-standard-notice/GraduationStandardNotice"

function renderNotice(encounter: Partial<StandardizedEncounter> | undefined, breakthrough = 16) {
  render(
    <I18nProvider>
      <GraduationStandardNotice encounter={encounter} breakthrough={breakthrough} />
    </I18nProvider>,
  )
  return screen.getByText("Standardized benchmark").parentElement!
}

describe("GraduationStandardNotice", () => {
  it("names every encounter setting the standard turns on and says the rest are off", () => {
    const notice = renderNotice({
      food: "simmeringFishSlices",
      hpFood: "lotusSoup",
      script: "voidrotScript",
      divinecraft: "fire",
    })

    expect(notice).toHaveTextContent(
      "Simmering Fish Slices, Lotus Soup, Voidrot Script, Divinecraft: Fire Oil — everything else off",
    )
    expect(notice).not.toHaveTextContent("Enable Dummy")
    expect(notice).not.toHaveTextContent("Healer Buff")
  })

  it("names the food that best available resolves to at the breakthrough", () => {
    expect(renderNotice({ food: "bestAvailable" }, 14)).toHaveTextContent(
      "Wild Ginseng Meatballs — everything else off",
    )
  })

  it("names a water enchant and its refined item", () => {
    expect(
      renderNotice({ divinecraft: "water", divinecraftRefinement: "deepPool" }),
    ).toHaveTextContent("Divinecraft: Aqua Wax, Aqua Wax: Deep Pool — everything else off")
  })

  it("leaves out a refined item that belongs to another element", () => {
    expect(
      renderNotice({ divinecraft: "water", divinecraftRefinement: "cinderAsh" }),
    ).not.toHaveTextContent("Cinder Ash")
  })

  it("says everything is off when the standard turns nothing on", () => {
    expect(renderNotice(undefined)).toHaveTextContent("everything off")
  })
})
