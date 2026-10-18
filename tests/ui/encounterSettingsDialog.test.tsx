import { useState } from "react"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  SCRIPT_IDS,
  SCRIPT_LABEL_KEYS,
  SCRIPT_MIN_BREAKTHROUGH,
} from "../../src/data/skills/buffs/scriptOptions"
import { ATTACK_FOODS, HP_FOODS } from "../../src/data/consumables/foods"
import { defaultInputs } from "../../src/engine/defaults"
import { scriptOptionId } from "../../src/engine/encounterOptions"
import englishCatalogue from "../../src/i18n/locales/en.json"
import {
  OPTION_HINT_KEYS,
  OPTION_LABEL_KEYS,
} from "../../src/ui/features/overview/encounter-settings-dialog/encounterOptionText"
import { runEngine } from "../../src/engine/dps"
import { defaultCombatSettings, type Inputs, type ScriptId } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { OverviewTab } from "../../src/ui/features/overview/overview-tab/OverviewTab"
import { EncounterSettingsTrigger } from "../../src/ui/features/overview/encounter-settings-trigger/EncounterSettingsTrigger"
import { EncounterSettingsDialog } from "../../src/ui/features/overview/encounter-settings-dialog/EncounterSettingsDialog"
import type { EncounterCategory } from "../../src/engine/encounterOptions"
import type { EncounterOptionsWorkerResponse } from "../../src/engine/dpsWorker"
import {
  postToDpsWorker,
  retainedResponse,
  subscribeToDpsWorker,
} from "../../src/ui/hooks/dpsWorkerClient"

vi.mock("../../src/ui/hooks/useItemRanking", () => ({
  useItemRanking: () => ({ rows: [], isPending: false }),
}))

vi.mock("../../src/ui/hooks/dpsWorkerClient", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/ui/hooks/dpsWorkerClient")>()),
  postToDpsWorker: vi.fn(),
  retainedResponse: vi.fn(() => null),
  subscribeToDpsWorker: vi.fn(() => () => {}),
}))

const SCRIPT_GATES = SCRIPT_IDS.map((id) => SCRIPT_MIN_BREAKTHROUGH[id])
const LOWEST_SCRIPT_GATE = Math.min(...SCRIPT_GATES)
const HIGHEST_SCRIPT_GATE = Math.max(...SCRIPT_GATES)
const BELOW_EVERY_GATE = LOWEST_SCRIPT_GATE - 1
const SCRIPTS_AT_LOWEST_GATE = SCRIPT_IDS.filter(
  (id) => SCRIPT_MIN_BREAKTHROUGH[id] === LOWEST_SCRIPT_GATE,
)
const LOCKED_AT_LOWEST_GATE = SCRIPT_IDS.filter(
  (id) => SCRIPT_MIN_BREAKTHROUGH[id] > LOWEST_SCRIPT_GATE,
)
const NEXT_SCRIPT_GATE = Math.min(...LOCKED_AT_LOWEST_GATE.map((id) => SCRIPT_MIN_BREAKTHROUGH[id]))
const LOCKED_SCRIPT = LOCKED_AT_LOWEST_GATE[0]
const english: Record<string, string> = englishCatalogue
const LOCKED_SCRIPT_LABEL = english[SCRIPT_LABEL_KEYS[LOCKED_SCRIPT]]

const latest = { inputs: defaultInputs }
const onChangeSpy = vi.fn()
const OVERVIEW_INPUTS = inputsAt(HIGHEST_SCRIPT_GATE)
const DPS_LOSS_TEXT = /−\d/
const REFINED_DIVINECRAFT_LABELS = [
  "Fire Oil: Cinder Ash",
  "Fire Oil: Scorching Flame",
  "Aqua Wax: Deep Pool",
  "Aqua Wax: Vast Ocean",
  "Toxic Powder: Viper's Fire",
  "Toxic Powder: Condensed Malice",
]
const REFINED_DIVINECRAFT_DPS = {
  "divinecraftRefinement:cinderAsh": 900,
  "divinecraftRefinement:scorchingFlame": 890,
  "divinecraftRefinement:deepPool": 880,
  "divinecraftRefinement:vastOcean": 870,
  "divinecraftRefinement:vipersFire": 860,
  "divinecraftRefinement:condensedMalice": 850,
}

function inputsAt(
  breakthrough: number,
  script: ScriptId | null = null,
  overrides: Partial<Inputs> = {},
): Inputs {
  return {
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    breakthrough,
    combatSettings: { ...defaultCombatSettings(), script },
    ...overrides,
  }
}

function Harness({ initial }: { initial: Inputs }) {
  const [inputs, setInputs] = useState(initial)
  const [result] = useState(() => runEngine(initial))
  function change(next: Inputs): void {
    onChangeSpy(next)
    latest.inputs = next
    setInputs(next)
  }
  const [isOpen, setIsOpen] = useState(false)
  const [category, setCategory] = useState<EncounterCategory>("food")
  return (
    <I18nProvider>
      <EncounterSettingsTrigger inputs={inputs} onOpen={() => setIsOpen(true)} />
      {isOpen && (
        <EncounterSettingsDialog
          inputs={inputs}
          engineInputs={inputs}
          category={category}
          onCategoryChange={setCategory}
          onChange={change}
          onClose={() => setIsOpen(false)}
        />
      )}
      <OverviewTab inputs={inputs} engineInputs={inputs} onChange={change} result={result} />
    </I18nProvider>
  )
}

function renderOverview(initial: Inputs = OVERVIEW_INPUTS) {
  latest.inputs = initial
  return render(<Harness initial={initial} />)
}

function triggerButton(): HTMLElement {
  return screen.getByRole("button", { name: /Encounter Settings/ })
}

function openDialog(): HTMLElement {
  fireEvent.click(triggerButton())
  return screen.getByRole("dialog", { name: "Encounter Settings" })
}

function clickDone(dialog: HTMLElement): void {
  fireEvent.click(within(dialog).getByRole("button", { name: "Done" }))
}

const ATTACK_FOOD_GROUP = "Attack-boosting food"
const HP_FOOD_GROUP = "HP-boosting food"

function foodChoice(dialog: HTMLElement, groupName: string, label: string): HTMLElement {
  return within(within(dialog).getByRole("radiogroup", { name: groupName })).getByRole("radio", {
    name: label,
  })
}

function labelOf(radio: HTMLElement): string | null | undefined {
  return document.getElementById(radio.getAttribute("aria-labelledby") ?? "")?.textContent
}

function postedInputs(): Inputs[] {
  return vi
    .mocked(postToDpsWorker)
    .mock.calls.flatMap(([request]) =>
      request.kind === "encounterOptions" ? [request.inputs] : [],
    )
}

function postedCategories(): string[] {
  return vi
    .mocked(postToDpsWorker)
    .mock.calls.flatMap(([request]) =>
      request.kind === "encounterOptions" ? [request.category] : [],
    )
}

beforeEach(() => {
  vi.mocked(postToDpsWorker).mockClear()
  onChangeSpy.mockClear()
  vi.mocked(retainedResponse).mockImplementation(() => null)
  vi.mocked(subscribeToDpsWorker).mockImplementation(() => () => {})
})

describe("the Encounter Settings trigger", () => {
  it("shows how many options are active and opens the dialog", () => {
    renderOverview()
    expect(triggerButton()).toHaveTextContent("2 active")
    expect(screen.queryByRole("dialog")).toBeNull()
    openDialog()
  })

  it("renders no chip row of active options or Qi target", () => {
    renderOverview(inputsAt(HIGHEST_SCRIPT_GATE, "voidrotScript"))
    expect(triggerButton()).toHaveTextContent("3 active")
    expect(screen.queryByText("Voidrot Script")).toBeNull()
    expect(screen.queryByText("Sword Trial Stake")).toBeNull()
    expect(screen.queryByText(/Dummy ·/)).toBeNull()
  })

  it("is no longer a panel of option controls on the page", () => {
    renderOverview()
    expect(screen.queryByRole("radio")).toBeNull()
    expect(screen.queryByRole("switch")).toBeNull()
  })

  it("shows the dummy state in the card title and follows dummy mode", () => {
    renderOverview(inputsAt(HIGHEST_SCRIPT_GATE, null, { dummyMode: false }))
    expect(triggerButton()).toHaveTextContent("Encounter Settings (Dummy: OFF)")
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("switch", { name: "Enable Dummy" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Done" }))
    expect(triggerButton()).toHaveTextContent("Encounter Settings (Dummy: ON)")
  })
})

describe("closing the dialog", () => {
  const discardingCloses: [string, (dialog: HTMLElement) => void][] = [
    ["Escape", () => fireEvent.keyDown(document, { key: "Escape" })],
    ["Cancel", (dialog) => fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))],
    [
      "the close button",
      (dialog) => fireEvent.click(within(dialog).getByRole("button", { name: "Close" })),
    ],
    ["a click on the backdrop", (dialog) => fireEvent.mouseDown(dialog)],
  ]

  it.each(discardingCloses)("discards the draft on %s", (_name, close) => {
    renderOverview()
    let dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("switch", { name: "Enable Dummy" }))
    fireEvent.click(foodChoice(dialog, ATTACK_FOOD_GROUP, "None"))
    close(dialog)
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(onChangeSpy).not.toHaveBeenCalled()

    dialog = openDialog()
    expect(within(dialog).getByRole("switch", { name: "Enable Dummy" })).toHaveAttribute(
      "aria-checked",
      "false",
    )
    expect(foodChoice(dialog, ATTACK_FOOD_GROUP, "Camel Milk Wine")).toHaveAttribute(
      "aria-checked",
      "true",
    )
  })

  it("closes on Done", () => {
    renderOverview()
    const dialog = openDialog()
    clickDone(dialog)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("does not call onChange on Done when nothing changed", () => {
    renderOverview()
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("switch", { name: "Enable Dummy" }))
    fireEvent.click(within(dialog).getByRole("switch", { name: "Enable Dummy" }))
    clickDone(dialog)
    expect(onChangeSpy).not.toHaveBeenCalled()
  })

  it("has no reset button", () => {
    renderOverview()
    const dialog = openDialog()
    expect(within(dialog).queryByRole("button", { name: /reset/i })).toBeNull()
  })
})

describe("categories", () => {
  it("shows the breakthrough read-only and starts on the food category with focus on its tab", () => {
    renderOverview()
    const dialog = openDialog()
    expect(within(dialog).getByText(`Breakthrough · BT ${HIGHEST_SCRIPT_GATE}`)).toBeInTheDocument()
    expect(within(dialog).getByRole("tab", { name: /Food Buff/ })).toHaveFocus()
    expect(within(dialog).getByRole("tabpanel")).toHaveTextContent("Simmering Fish Slices")
  })

  it("switches category on click and moves between tabs with the arrow keys", () => {
    renderOverview()
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("tab", { name: /Divinecraft/ }))
    expect(within(dialog).getByRole("tab", { name: /Divinecraft/ })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(within(dialog).getByRole("radio", { name: "Fire Oil" })).toBeInTheDocument()

    fireEvent.keyDown(within(dialog).getByRole("tablist"), { key: "ArrowDown" })
    expect(within(dialog).getByRole("tab", { name: /Scripts/ })).toHaveFocus()
    fireEvent.keyDown(within(dialog).getByRole("tablist"), { key: "ArrowUp" })
    expect(within(dialog).getByRole("tab", { name: /Divinecraft/ })).toHaveFocus()
  })

  it("reopens on the category that was last open", () => {
    renderOverview()
    let dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("tab", { name: /Teammate Buffs/ }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Done" }))
    dialog = openDialog()
    expect(within(dialog).getByRole("tab", { name: /Teammate Buffs/ })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })

  it("badges each category with its active options", () => {
    renderOverview(inputsAt(HIGHEST_SCRIPT_GATE, "voidrotScript"))
    const dialog = openDialog()
    expect(within(dialog).getByRole("tab", { name: /Food Buff/ })).toHaveTextContent("1")
    expect(within(dialog).getByRole("tab", { name: /Divinecraft/ })).toHaveTextContent("1")
    expect(within(dialog).getByRole("tab", { name: /Scripts/ })).toHaveTextContent("1")
    expect(within(dialog).getByRole("tab", { name: /Teammate Buffs/ }).textContent).toBe(
      "Teammate Buffs",
    )
  })
})

describe("changing options", () => {
  it("keeps clicks in the draft and applies them all in one onChange on Done", () => {
    renderOverview()
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("switch", { name: "Enable Dummy" }))
    fireEvent.click(foodChoice(dialog, ATTACK_FOOD_GROUP, "None"))
    fireEvent.click(foodChoice(dialog, HP_FOOD_GROUP, "Lotus Soup"))
    fireEvent.click(within(dialog).getByRole("switch", { name: "Orchid Essence" }))
    fireEvent.click(within(dialog).getByRole("tab", { name: /Divinecraft/ }))
    fireEvent.click(within(dialog).getByRole("radio", { name: "Toxic Powder" }))
    fireEvent.click(within(dialog).getByRole("tab", { name: /Teammate Buffs/ }))
    fireEvent.click(within(dialog).getByRole("switch", { name: "Healer Buff" }))
    fireEvent.click(within(dialog).getByRole("switch", { name: "Bitter Season (from a teammate)" }))
    fireEvent.click(within(dialog).getByRole("tab", { name: /Extra Settings/ }))
    fireEvent.click(within(dialog).getByRole("radio", { name: "Hero's Realm Stake" }))
    expect(onChangeSpy).not.toHaveBeenCalled()
    expect(triggerButton()).toHaveTextContent("Encounter Settings (Dummy: OFF)")

    clickDone(dialog)
    expect(onChangeSpy).toHaveBeenCalledTimes(1)
    expect(latest.inputs).toEqual({
      ...OVERVIEW_INPUTS,
      dummyMode: true,
      food: null,
      hpFood: "lotusSoup",
      divinecraft: "poison",
      shareDebuff5HenZhi: true,
      qiTarget: "herosRealm",
      combatSettings: {
        ...OVERVIEW_INPUTS.combatSettings,
        fragrantOrchidBathBean: true,
        healerBuff: true,
      },
    })
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("shows the draft in the badges, the footer and the dummy row", () => {
    renderOverview()
    const dialog = openDialog()
    expect(within(dialog).getByText("2 settings active")).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("switch", { name: "Orchid Essence" }))
    fireEvent.click(within(dialog).getByRole("tab", { name: /Teammate Buffs/ }))
    fireEvent.click(within(dialog).getByRole("switch", { name: "Healer Buff" }))
    expect(within(dialog).getByText("4 settings active")).toBeInTheDocument()
    expect(within(dialog).getByRole("tab", { name: /Food Buff/ })).toHaveTextContent("2")
    expect(within(dialog).getByRole("tab", { name: /Teammate Buffs/ })).toHaveTextContent("1")
    expect(triggerButton()).toHaveTextContent("2 active")
  })

  it("requests the option differences for the draft", () => {
    renderOverview()
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("switch", { name: "Orchid Essence" }))
    fireEvent.click(within(dialog).getByRole("switch", { name: "Enable Dummy" }))
    const requested = postedInputs().at(-1)
    expect(requested?.combatSettings?.fragrantOrchidBathBean).toBe(true)
    expect(requested?.dummyMode).toBe(true)
    expect(latest.inputs.dummyMode).toBe(false)
  })

  it("keeps Enable Dummy above the tabs on every category, outside the Extras options", () => {
    renderOverview()
    const dialog = openDialog()
    for (const tab of within(dialog).getAllByRole("tab")) {
      fireEvent.click(tab)
      const dummySwitch = within(dialog).getByRole("switch", { name: "Enable Dummy" })
      expect(
        dummySwitch.compareDocumentPosition(tab) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
    fireEvent.click(within(dialog).getByRole("tab", { name: /Extra Settings/ }))
    const panel = within(dialog).getByRole("tabpanel")
    expect(within(panel).queryByRole("switch", { name: "Enable Dummy" })).toBeNull()
    expect(within(panel).queryByText("Target")).toBeNull()
  })

  it("flips dummy mode from the dialog", () => {
    renderOverview()
    const dialog = openDialog()
    const dummySwitch = within(dialog).getByRole("switch", { name: "Enable Dummy" })
    fireEvent.click(dummySwitch)
    expect(dummySwitch).toHaveAttribute("aria-checked", "true")
    clickDone(dialog)
    expect(latest.inputs.dummyMode).toBe(true)
  })

  it("picks a single choice", () => {
    renderOverview()
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("tab", { name: /Divinecraft/ }))
    expect(within(dialog).getByRole("radio", { name: "Fire Oil" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
    fireEvent.click(within(dialog).getByRole("radio", { name: "Toxic Powder" }))
    clickDone(dialog)
    expect(latest.inputs.divinecraft).toBe("poison")
  })
})

describe("Divinecraft options", () => {
  function openDivinecraft(overrides: Partial<Inputs> = {}): HTMLElement {
    renderOverview(inputsAt(HIGHEST_SCRIPT_GATE, null, overrides))
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("tab", { name: /Divinecraft/ }))
    return dialog
  }

  function subtitleOf(dialog: HTMLElement, label: string): string | undefined {
    const description = within(dialog)
      .getByRole("radio", { name: label })
      .getAttribute("aria-describedby")
    return description
      ?.split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .find((text) => text && !/^(current|[+\-±])/.test(text))
  }

  it.each([BELOW_EVERY_GATE, HIGHEST_SCRIPT_GATE])(
    "offers one flat list of ten options at breakthrough %i, with no group headings",
    (breakthrough) => {
      renderOverview(inputsAt(breakthrough))
      const dialog = openDialog()
      fireEvent.click(within(dialog).getByRole("tab", { name: /Divinecraft/ }))
      const radios = within(dialog).getAllByRole("radio")
      expect(radios.map(labelOf)).toEqual([
        "None",
        "Fire Oil",
        "Fire Oil: Cinder Ash",
        "Fire Oil: Scorching Flame",
        "Aqua Wax",
        "Aqua Wax: Deep Pool",
        "Aqua Wax: Vast Ocean",
        "Toxic Powder",
        "Toxic Powder: Viper's Fire",
        "Toxic Powder: Condensed Malice",
      ])
      expect(within(dialog).getAllByRole("radiogroup")).toHaveLength(1)
      expect(within(dialog).queryByText("Enchant")).toBeNull()
      expect(within(dialog).queryByText("Refined item")).toBeNull()
    },
  )

  it("gives each option its effects as subtitle, refined items adding their extra buff", () => {
    const dialog = openDivinecraft()
    expect(subtitleOf(dialog, "None")).toBe("No enchant")
    expect(subtitleOf(dialog, "Fire Oil")).toBe(
      "DMG +1.5 %; direct hits apply Burn; every 5 direct hits set off an explosion",
    )
    expect(subtitleOf(dialog, "Aqua Wax")).toBe("DMG +1 %")
    expect(subtitleOf(dialog, "Toxic Powder")).toBe(
      "DMG +1 %, Qi DMG +5 %; direct hits apply Poisoned",
    )
    expect(subtitleOf(dialog, "Fire Oil: Cinder Ash")).toBe(
      "DMG +1.5 %; direct hits apply Burn; every 5 direct hits set off an explosion; Heart Poison: Qi DMG +4 %",
    )
    expect(subtitleOf(dialog, "Fire Oil: Scorching Flame")).toBe(
      "DMG +1.5 %; direct hits apply Burn; every 5 direct hits set off an explosion; Nourishing Water: heals only, no damage on a stake",
    )
    expect(subtitleOf(dialog, "Aqua Wax: Deep Pool")).toBe("DMG +1 %; Tempered Fire: DMG +0.4 %")
    expect(subtitleOf(dialog, "Toxic Powder: Viper's Fire")).toBe(
      "DMG +1 %, Qi DMG +5 %; direct hits apply Poisoned; Tempered Fire: DMG +0.4 %",
    )
  })

  it("writes the plain enchant and clears the refined item", () => {
    const dialog = openDivinecraft({ divinecraft: "fire", divinecraftRefinement: "cinderAsh" })
    fireEvent.click(within(dialog).getByRole("radio", { name: "Aqua Wax" }))
    clickDone(dialog)
    expect(latest.inputs.divinecraft).toBe("water")
    expect(latest.inputs.divinecraftRefinement).toBeNull()
  })

  it("writes the element and the refined item together", () => {
    const dialog = openDivinecraft({ divinecraft: "fire" })
    fireEvent.click(within(dialog).getByRole("radio", { name: "Toxic Powder: Viper's Fire" }))
    expect(
      within(dialog).getByRole("radio", { name: "Toxic Powder: Viper's Fire" }),
    ).toHaveAttribute("aria-checked", "true")
    clickDone(dialog)
    expect(latest.inputs.divinecraft).toBe("poison")
    expect(latest.inputs.divinecraftRefinement).toBe("vipersFire")
  })

  it("writes none as no enchant and no refined item", () => {
    const dialog = openDivinecraft({ divinecraft: "poison", divinecraftRefinement: "vipersFire" })
    fireEvent.click(within(dialog).getByRole("radio", { name: "None" }))
    clickDone(dialog)
    expect(latest.inputs.divinecraft).toBeNull()
    expect(latest.inputs.divinecraftRefinement).toBeNull()
  })

  it("shows the plain enchant for a stored mismatched pair and keeps it until another option is picked", () => {
    const dialog = openDivinecraft({ divinecraft: "fire", divinecraftRefinement: "deepPool" })
    const checked = within(dialog)
      .getAllByRole("radio")
      .filter((radio) => radio.getAttribute("aria-checked") === "true")
    expect(checked.map(labelOf)).toEqual(["Fire Oil"])
    clickDone(dialog)
    expect(latest.inputs.divinecraft).toBe("fire")
    expect(latest.inputs.divinecraftRefinement).toBe("deepPool")
  })
})

describe("the dummy row", () => {
  it("has no empty diff column before its switch", () => {
    renderOverview()
    const dialog = openDialog()
    const dummySwitch = within(dialog).getByRole("switch", { name: "Enable Dummy" })
    const optionSwitch = within(dialog).getByRole("switch", { name: "Orchid Essence" })
    expect(dummySwitch.querySelector('[class*="diff"]')).toBeNull()
    expect(optionSwitch.querySelector('[class*="diff"]')).not.toBeNull()
  })
})

describe("scripts and the breakthrough gate", () => {
  function openScripts(initial: Inputs): HTMLElement {
    renderOverview(initial)
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("tab", { name: /Scripts/ }))
    return dialog
  }

  it("offers every script once the breakthrough reaches the highest gate", () => {
    const dialog = openScripts(inputsAt(HIGHEST_SCRIPT_GATE))
    expect(within(dialog).getAllByRole("radio")).toHaveLength(SCRIPT_IDS.length + 1)
    expect(within(dialog).queryByText(/unlock from BT/)).toBeNull()
  })

  it("hides scripts above the breakthrough and says how many unlock at which one", () => {
    const dialog = openScripts(inputsAt(LOWEST_SCRIPT_GATE))
    expect(within(dialog).getAllByRole("radio")).toHaveLength(SCRIPTS_AT_LOWEST_GATE.length + 1)
    expect(within(dialog).queryByRole("radio", { name: LOCKED_SCRIPT_LABEL })).toBeNull()
    expect(
      within(dialog).getByText(
        `${LOCKED_AT_LOWEST_GATE.length} more options unlock from BT ${NEXT_SCRIPT_GATE}`,
      ),
    ).toBeInTheDocument()
  })

  it("offers only none below every gate and points at the lowest one", () => {
    const dialog = openScripts(inputsAt(BELOW_EVERY_GATE))
    expect(within(dialog).getAllByRole("radio")).toHaveLength(1)
    expect(
      within(dialog).getByText(
        `${SCRIPT_IDS.length} more options unlock from BT ${LOWEST_SCRIPT_GATE}`,
      ),
    ).toBeInTheDocument()
  })

  it("keeps a script saved above the breakthrough and shows a note instead of a selection", () => {
    const dialog = openScripts(inputsAt(LOWEST_SCRIPT_GATE, LOCKED_SCRIPT))
    expect(
      within(dialog).getByText(
        `${LOCKED_SCRIPT_LABEL} is saved but not available at BT ${LOWEST_SCRIPT_GATE}`,
      ),
    ).toBeInTheDocument()
    for (const radio of within(dialog).getAllByRole("radio")) {
      expect(radio).toHaveAttribute("aria-checked", "false")
    }

    fireEvent.click(within(dialog).getByRole("tab", { name: /Teammate Buffs/ }))
    fireEvent.click(within(dialog).getByRole("switch", { name: "Healer Buff" }))
    fireEvent.click(within(dialog).getByRole("tab", { name: /Divinecraft/ }))
    fireEvent.click(within(dialog).getByRole("radio", { name: "Toxic Powder" }))
    clickDone(dialog)
    expect(latest.inputs.combatSettings?.script).toBe(LOCKED_SCRIPT)
  })

  it("does not count a saved script that is not available", () => {
    renderOverview(inputsAt(LOWEST_SCRIPT_GATE, LOCKED_SCRIPT, { food: null }))
    expect(triggerButton()).toHaveTextContent("1 active")
  })
})

describe("script card text", () => {
  it("names and describes every script", () => {
    for (const id of SCRIPT_IDS) {
      const optionId = scriptOptionId(id)
      expect(english[OPTION_LABEL_KEYS[optionId]]).toBeTruthy()
      expect(english[OPTION_HINT_KEYS[optionId]]).toBeTruthy()
    }
  })
})

describe("food options", () => {
  function openFood(breakthrough: number, overrides: Partial<Inputs> = {}): HTMLElement {
    renderOverview(inputsAt(breakthrough, null, overrides))
    return openDialog()
  }

  function foodSubtitle(dialog: HTMLElement, groupName: string, label: string): string | undefined {
    return foodChoice(dialog, groupName, label)
      .getAttribute("aria-describedby")
      ?.split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .find((text) => text && !/^(current|[+\-±])/.test(text))
  }

  const radiosIn = (dialog: HTMLElement, groupName: string) =>
    within(within(dialog).getByRole("radiogroup", { name: groupName })).getAllByRole("radio")

  it("splits the food category into attack food, HP food and other consumables", () => {
    const dialog = openFood(HIGHEST_SCRIPT_GATE)
    expect(radiosIn(dialog, ATTACK_FOOD_GROUP)).toHaveLength(ATTACK_FOODS.length + 1)
    expect(radiosIn(dialog, HP_FOOD_GROUP)).toHaveLength(HP_FOODS.length + 1)
    const otherConsumables = within(dialog).getByRole("group", { name: "Other consumables" })
    expect(within(otherConsumables).getByRole("switch", { name: "Orchid Essence" })).toBeVisible()
  })

  it("describes the Orchid Essence effect", () => {
    const dialog = openFood(HIGHEST_SCRIPT_GATE)
    const description = within(dialog)
      .getByRole("switch", { name: "Orchid Essence" })
      .getAttribute("aria-describedby")
    expect(document.getElementById(description!.split(" ")[0])).toHaveTextContent(
      "Max Endurance +20; jump and lightness skills cost 50 % less Endurance; 30 min",
    )
  })

  it("offers only the foods the breakthrough allows and says how many unlock at which", () => {
    const dialog = openFood(13)
    const attackAvailable = ATTACK_FOODS.filter((food) => food.minBreakthrough <= 13)
    const attackLocked = ATTACK_FOODS.filter((food) => food.minBreakthrough > 13)
    expect(radiosIn(dialog, ATTACK_FOOD_GROUP)).toHaveLength(attackAvailable.length + 1)
    expect(
      within(dialog).getByText(`${attackLocked.length} more options unlock from BT 14`),
    ).toBeInTheDocument()
    expect(radiosIn(dialog, HP_FOOD_GROUP)).toHaveLength(2)
    expect(within(dialog).getByText("5 more options unlock from BT 14")).toBeInTheDocument()
    expect(
      within(dialog).queryByRole("radio", { name: "Simmering Fish Slices" }),
    ).not.toBeInTheDocument()
  })

  it("subtitles every food with its effect", () => {
    const dialog = openFood(HIGHEST_SCRIPT_GATE)
    expect(foodSubtitle(dialog, ATTACK_FOOD_GROUP, "Simmering Fish Slices")).toBe(
      "Physical Attack +120–240",
    )
    expect(foodSubtitle(dialog, ATTACK_FOOD_GROUP, "Rotisserie Venison")).toBe(
      "Physical Attack +10–20",
    )
    expect(foodSubtitle(dialog, ATTACK_FOOD_GROUP, "Cai Nengjia's Special Bun")).toBe(
      "Physical Attack +90–180 (flat, not raised by % Physical Attack)",
    )
    expect(foodSubtitle(dialog, HP_FOOD_GROUP, "Wine-Braised Pork")).toBe("Max HP +13 800")
    expect(foodSubtitle(dialog, HP_FOOD_GROUP, "Fruit Cream Rolls")).toBe("Max HP +8 200")
  })

  it("writes the picked foods into the draft and applies them on Done", () => {
    const dialog = openFood(HIGHEST_SCRIPT_GATE)
    fireEvent.click(foodChoice(dialog, ATTACK_FOOD_GROUP, "Double Shreds"))
    fireEvent.click(foodChoice(dialog, HP_FOOD_GROUP, "Persimmon Pastry"))
    expect(onChangeSpy).not.toHaveBeenCalled()
    expect(foodChoice(dialog, ATTACK_FOOD_GROUP, "Double Shreds")).toHaveAttribute(
      "aria-checked",
      "true",
    )
    clickDone(dialog)
    expect(latest.inputs.food).toBe("doubleShreds")
    expect(latest.inputs.hpFood).toBe("persimmonPastry")
  })

  it("counts each food that is not none", () => {
    const dialog = openFood(HIGHEST_SCRIPT_GATE, { hpFood: "lotusSoup" })
    expect(within(dialog).getByRole("tab", { name: /Food Buff/ })).toHaveTextContent("2")
    fireEvent.click(foodChoice(dialog, ATTACK_FOOD_GROUP, "None"))
    expect(within(dialog).getByRole("tab", { name: /Food Buff/ })).toHaveTextContent("1")
  })

  it("keeps a food saved above the breakthrough and shows a note instead of a selection", () => {
    const dialog = openFood(16, { food: "twinImmortalsStew", hpFood: "lotusSoup" })
    expect(
      within(dialog).getByText("Twin Immortals Stew is saved but not available at BT 16"),
    ).toBeInTheDocument()
    for (const radio of radiosIn(dialog, ATTACK_FOOD_GROUP)) {
      expect(radio).toHaveAttribute("aria-checked", "false")
    }
    fireEvent.click(within(dialog).getByRole("switch", { name: "Orchid Essence" }))
    clickDone(dialog)
    expect(latest.inputs.food).toBe("twinImmortalsStew")
    expect(latest.inputs.hpFood).toBe("lotusSoup")
  })

  it("keeps an unrecognised stored food and offers no selection for it", () => {
    const dialog = openFood(HIGHEST_SCRIPT_GATE, { food: "aFoodFromALaterBuild" as never })
    for (const radio of radiosIn(dialog, ATTACK_FOOD_GROUP)) {
      expect(radio).toHaveAttribute("aria-checked", "false")
    }
    fireEvent.click(within(dialog).getByRole("switch", { name: "Orchid Essence" }))
    clickDone(dialog)
    expect(latest.inputs.food).toBe("aFoodFromALaterBuild")
  })
})

describe("worker scope", () => {
  it("posts nothing while the dialog is closed", () => {
    renderOverview()
    expect(postedCategories()).toHaveLength(0)
  })

  it("posts only for the open category and re-posts when the category changes", () => {
    renderOverview()
    const dialog = openDialog()
    expect(postedCategories()).toEqual(["food"])

    fireEvent.click(within(dialog).getByRole("tab", { name: /Scripts/ }))
    expect(postedCategories()).toEqual(["food", "scripts"])
  })

  it("re-posts for the open category after an option changes", () => {
    renderOverview()
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("switch", { name: "Orchid Essence" }))
    const categories = postedCategories()
    expect(categories).toEqual(["food", "food"])
  })

  it("stops posting once the dialog is closed", () => {
    renderOverview()
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("button", { name: "Done" }))
    expect(postedCategories()).toHaveLength(1)
  })
})

describe("DPS differences", () => {
  it("orders the options of a group by their DPS value, highest first", () => {
    vi.mocked(retainedResponse).mockImplementation(() => ({
      kind: "encounterOptions",
      reqId: 1,
      inputs: OVERVIEW_INPUTS,
      category: "teammate",
      baselineDps: 1000,
      dpsByOption: {
        healerBuff: 1010,
        healerPanaceaFan: 1050,
        breakExtension: 1020,
        dragonsBreath: 1005,
        shareDebuff5HenZhi: 1001,
        shareEasyHurt: 1002,
      },
    }))
    renderOverview()
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("tab", { name: /Teammate Buffs/ }))
    const partyGroup = within(dialog).getByRole("group", { name: "Party buffs" })
    expect(
      within(partyGroup)
        .getAllByRole("switch")
        .map((card) => card.textContent),
    ).toEqual([
      expect.stringContaining("Panacea"),
      expect.stringContaining("Break"),
      expect.stringContaining("Healer Buff"),
      expect.stringContaining("Dragon"),
    ])
  })

  it("shows each option's change against the baseline once the worker answers", () => {
    vi.mocked(retainedResponse).mockImplementation(() => ({
      kind: "encounterOptions",
      reqId: 1,
      inputs: OVERVIEW_INPUTS,
      category: "food",
      baselineDps: 1000,
      dpsByOption: { "food:none": 900, "hpFood:lotusSoup": 1000, fragrantOrchidBathBean: 1000.2 },
    }))
    renderOverview()
    const dialog = openDialog()
    expect(foodChoice(dialog, HP_FOOD_GROUP, "Lotus Soup")).toHaveTextContent("±0.0 %")
    expect(foodChoice(dialog, ATTACK_FOOD_GROUP, "None")).toHaveTextContent("−10.0 %")
    expect(within(dialog).getByRole("switch", { name: "Orchid Essence" })).toHaveTextContent(
      "±0.0 %",
    )
  })

  it("keeps the settled order and shows no stale change after a selection until its own result arrives", () => {
    const fireSelected = inputsAt(HIGHEST_SCRIPT_GATE, null, {
      divinecraft: "fire",
      divinecraftRefinement: null,
    })
    const resultForFire: EncounterOptionsWorkerResponse = {
      reqId: 1,
      inputs: fireSelected,
      category: "divinecraft",
      baselineDps: 1000,
      dpsByOption: {
        ...REFINED_DIVINECRAFT_DPS,
        "divinecraft:none": 980,
        "divinecraft:water": 990,
        "divinecraft:poison": 995,
      },
    }
    let deliverResult: (response: EncounterOptionsWorkerResponse) => void = () => {}
    vi.mocked(retainedResponse).mockImplementation(() => resultForFire)
    vi.mocked(subscribeToDpsWorker).mockImplementation((_kind, listener) => {
      deliverResult = listener as typeof deliverResult
      return () => {}
    })
    renderOverview(fireSelected)
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole("tab", { name: /Divinecraft/ }))
    const cardTexts = () =>
      within(dialog)
        .getAllByRole("radio")
        .map((card) => card.textContent)
    const settledOrder = [
      expect.stringMatching(/^Fire Oil(?!:)/),
      expect.stringMatching(/^Toxic Powder(?!:)/),
      expect.stringMatching(/^Aqua Wax(?!:)/),
      expect.stringMatching(/^None/),
      ...REFINED_DIVINECRAFT_LABELS.map((label) => expect.stringContaining(label)),
    ]
    expect(cardTexts()).toEqual(settledOrder)
    expect(cardTexts().join()).toMatch(DPS_LOSS_TEXT)

    fireEvent.click(within(dialog).getByRole("radio", { name: "Toxic Powder" }))
    expect(cardTexts()).toEqual(settledOrder)
    expect(cardTexts().join()).not.toMatch(DPS_LOSS_TEXT)

    act(() => {
      deliverResult({
        reqId: 2,
        inputs: { ...fireSelected, divinecraft: "poison" },
        category: "divinecraft",
        baselineDps: 1000,
        dpsByOption: {
          ...REFINED_DIVINECRAFT_DPS,
          "divinecraft:none": 980,
          "divinecraft:water": 990,
          "divinecraft:fire": 970,
        },
      })
    })
    expect(cardTexts()).toEqual([
      expect.stringMatching(/^Toxic Powder(?!:)/),
      expect.stringMatching(/^Aqua Wax(?!:)/),
      expect.stringMatching(/^None/),
      expect.stringMatching(/^Fire Oil(?!:)/),
      ...REFINED_DIVINECRAFT_LABELS.map((label) => expect.stringContaining(label)),
    ])
    expect(cardTexts().join()).toMatch(DPS_LOSS_TEXT)
  })

  it("exposes the change in the accessible description, not the name", () => {
    vi.mocked(retainedResponse).mockImplementation(() => ({
      kind: "encounterOptions",
      reqId: 1,
      inputs: OVERVIEW_INPUTS,
      category: "food",
      baselineDps: 1000,
      dpsByOption: { "food:none": 900, fragrantOrchidBathBean: 1000.2 },
    }))
    renderOverview()
    const dialog = openDialog()
    const none = foodChoice(dialog, ATTACK_FOOD_GROUP, "None")
    expect(none).toHaveAccessibleDescription(expect.stringContaining("−10.0 %"))
    expect(none).toHaveAccessibleName("None")
  })
})
