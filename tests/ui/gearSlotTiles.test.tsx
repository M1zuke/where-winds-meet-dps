import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { GearSlotTiles } from "../../src/ui/features/gear/gear-slot-tiles/GearSlotTiles"
import { GearSetStrip } from "../../src/ui/features/gear/gear-set-strip/GearSetStrip"
import { withBowSet } from "../helpers/withGearSet"

const CLASS = "bellstrikeUmbra"
const BUILD = classDefinition(CLASS)!.graduationBuilds[0]
const PROFILE = { classId: CLASS, graduationBuildId: BUILD.id }

function piece(id: string, slot: GearPiece["slot"], extra: Partial<GearPiece> = {}): GearPiece {
  return {
    id,
    slot,
    level: 96,
    rarity: "legendary",
    minPhys: 1000,
    maxPhys: 2000,
    hp: 0,
    physDef: 0,
    words: [
      { word: "crit", value: 0.03, retuned: false },
      { word: "power", value: 40, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
    ],
    attunement: "physPen",
    attunementValue: 0.03,
    relayed: false,
    ...extra,
  }
}

function inputsWith(pieces: GearPiece[]): Inputs {
  const equipped = { ...defaultInputs.equipped }
  for (const equippedPiece of pieces) equipped[equippedPiece.slot] = equippedPiece.id
  return { ...defaultInputs, classId: CLASS, inventory: pieces, equipped }
}

function renderTiles(inputs: Inputs, extraProfile: object = {}) {
  return render(
    <I18nProvider>
      <GearSlotTiles
        inputs={inputs}
        inventory={inputs.inventory}
        profile={{ ...PROFILE, ...extraProfile }}
        equipped={inputs.equipped}
        selectedPieceId={null}
        selectedSlot={null}
        selectedBowSlot={null}
        onSelectSlot={() => {}}
        onSelectBowSlot={() => {}}
        dpsDeltas={{}}
        dpsDeltasPending={false}
      />
    </I18nProvider>,
  )
}

function tileOf(slotLabel: string): HTMLElement {
  return screen.getAllByRole("button").find((button) => button.textContent?.startsWith(slotLabel))!
}

describe("slot tiles", () => {
  it("lays the ten tiles out five by two with the bow and the thumb ring at the row ends", () => {
    renderTiles(inputsWith([]))

    const heads = screen
      .getAllByRole("button")
      .map((button) => button.firstElementChild?.textContent)
    expect(heads).toEqual([
      "Strategic Sword",
      "Heavenquaker Spear",
      "Helm",
      "Armor",
      "Bow",
      "Disc",
      "Pendant",
      "Greaves",
      "Bracer",
      "Thumb Ring",
    ])
  })

  it("reads level and set on a set-bearing slot and level alone on an armor slot", () => {
    renderTiles(
      inputsWith([
        piece("sword", "leftWeapon", { set: "hawkwing" }),
        piece("helm", "helm", { set: "hawkwing" }),
      ]),
    )

    expect(tileOf("Strategic Sword")).toHaveTextContent("Lv96 · Hawkwing")
    expect(tileOf("Helm")).toHaveTextContent("Lv96")
    expect(tileOf("Helm")).not.toHaveTextContent("Hawkwing")
    expect(tileOf("Helm")).not.toHaveTextContent("Legendary")
  })

  it("marks a set-bearing piece without a set as no set", () => {
    renderTiles(inputsWith([piece("sword", "leftWeapon")]))

    expect(tileOf("Strategic Sword")).toHaveTextContent("Lv96 · no set")
  })

  it("shows a known armor-group set by name and an unknown id as stored", () => {
    renderTiles(
      inputsWith([
        piece("sword", "leftWeapon", { set: "calmwaters" }),
        piece("spear", "rightWeapon", { set: "mystery-set" }),
      ]),
    )

    expect(tileOf("Strategic Sword")).toHaveTextContent("Lv96 · Calmwaters")
    expect(tileOf("Heavenquaker Spear")).toHaveTextContent("Lv96 · mystery-set")
  })

  it("fills as many of the four pips as there are equipped pieces of the set", () => {
    renderTiles(
      inputsWith([
        piece("sword", "leftWeapon", { set: "hawkwing" }),
        piece("spear", "rightWeapon", { set: "hawkwing" }),
        piece("disc", "disc", { set: "jadeware" }),
      ]),
    )

    expect(within(tileOf("Strategic Sword")).getByRole("img")).toHaveAttribute(
      "aria-label",
      "2 of 4 equipped",
    )
    expect(within(tileOf("Disc")).getByRole("img")).toHaveAttribute("aria-label", "1 of 4 equipped")
    expect(within(tileOf("Helm")).queryByRole("img")).toBeNull()
  })

  it("shows the pair bonus on both bow tiles when they carry the same set", () => {
    const inputs = withBowSet(inputsWith([]), "crit", 100)
    renderTiles(inputs)

    expect(tileOf("Bow")).toHaveTextContent("Lv100 · Critical")
    expect(tileOf("Bow")).toHaveTextContent("Pair · +5.2% Critical Rate")
    expect(tileOf("Thumb Ring")).toHaveTextContent("Pair · +5.2% Critical Rate")
    expect(within(tileOf("Bow")).getByRole("img")).toHaveAttribute("aria-label", "2 of 2 equipped")
  })

  it("shows an unpaired footer when the bow and the thumb ring carry different sets", () => {
    const inputs = withBowSet(inputsWith([]), "crit", 100)
    renderTiles({
      ...inputs,
      bowGear: { ...inputs.bowGear, thumbRing: { ...inputs.bowGear.thumbRing!, set: "affinity" } },
    })

    expect(tileOf("Bow")).toHaveTextContent("Unpaired · no bonus")
    expect(tileOf("Thumb Ring")).toHaveTextContent("Unpaired · no bonus")
  })

  it("renders an empty bow slot exactly like an empty gear slot", () => {
    renderTiles(inputsWith([]))

    expect(tileOf("Bow")).toHaveTextContent("Empty")
    expect(tileOf("Thumb Ring")).toHaveTextContent("Empty")
    expect(tileOf("Helm")).toHaveTextContent("Empty")
  })

  it("keeps the heirloom shine on a tile whose piece matches the followed build", () => {
    const target = BUILD.gear.find((gearPiece) => gearPiece.slot === "helm")!
    const heirloom: GearPiece = { ...target, id: "heirloom-helm" }
    const { container } = renderTiles(inputsWith([heirloom]))

    expect(tileOf("Helm").querySelector("svg[aria-hidden='true']")).not.toBeNull()
    expect(container.querySelectorAll("svg[aria-hidden='true']").length).toBeGreaterThan(0)
  })
})

describe("set strip", () => {
  function renderStrip(inputs: Inputs) {
    return render(
      <I18nProvider>
        <GearSetStrip inputs={inputs} />
      </I18nProvider>,
    )
  }

  it("says none when no equipped piece carries a set", () => {
    renderStrip(inputsWith([piece("sword", "leftWeapon")]))

    expect(screen.getByText("none")).toBeInTheDocument()
    expect(screen.getByText("Bow and Thumb Ring differ — no bonus")).toBeInTheDocument()
  })

  it("lists each equipped set with its count and the tiers it has reached", () => {
    renderStrip(
      inputsWith([
        piece("sword", "leftWeapon", { set: "hawkwing" }),
        piece("spear", "rightWeapon", { set: "hawkwing" }),
        piece("disc", "disc", { set: "jadeware" }),
      ]),
    )

    expect(screen.getByText("Hawkwing")).toBeInTheDocument()
    expect(screen.getByText("2/4")).toBeInTheDocument()
    expect(screen.getByText("1/4")).toBeInTheDocument()
    expect(screen.getByText(/^2pc \+4\.5% Affinity Rate$/).className).toMatch(/_on_/)
    for (const chip of screen.getAllByText("4pc")) expect(chip.className).not.toMatch(/_on_/)
  })

  it("names the paired bow set with its level and bonus", () => {
    renderStrip(withBowSet(inputsWith([]), "affinity", 96))

    expect(screen.getByText("Affinity")).toBeInTheDocument()
    expect(screen.getByText("Lv96")).toBeInTheDocument()
    expect(screen.getByText(/\+2\.2% Affinity Rate/)).toBeInTheDocument()
  })

  it("names the crit bow set Critical", () => {
    renderStrip(withBowSet(inputsWith([]), "crit", 100))

    expect(screen.getByText("Critical")).toBeInTheDocument()
  })
})
