import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { GEAR_WORD_IDS } from "../../src/data/stats/statLines"
import type { RetunementRow } from "../../src/engine/dpsWorker"
import type { GearPiece, GearWordId } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { RetunementAnalyzerPanel } from "../../src/ui/features/gear/retunement-analyzer-panel/RetunementAnalyzerPanel"

const CLASS = "stonesplitStrength"
const TARGET = classDefinition(CLASS)!.graduationBuilds[0].gear.find(
  (piece) => piece.slot === "helm",
)!
const PERFECT = TARGET.words
  .map((word) => word.word)
  .filter((word): word is GearWordId => word !== "")
const FOREIGN = GEAR_WORD_IDS.filter((word) => !PERFECT.includes(word))

function pieceWith(words: readonly GearWordId[]): GearPiece {
  return {
    ...TARGET,
    id: "test-piece",
    words: words.map((word) => ({ word, value: 1 })) as GearPiece["words"],
  }
}

function row(slotIndex: number, word: GearWordId, deltaDps: number): RetunementRow {
  return {
    slotIndex,
    word,
    legal: true,
    isCurrent: false,
    deltaDps,
    deltaDpsRelayed: deltaDps,
    poolSize: 10,
    pDraw: null,
    pImprove: null,
    eDeltaDps: null,
  }
}

function renderPanel(piece: GearPiece, rows: RetunementRow[]) {
  render(
    <I18nProvider>
      <RetunementAnalyzerPanel
        piece={piece}
        profile={{ classId: CLASS }}
        rows={rows}
        reason="ok"
        isPending={false}
      />
    </I18nProvider>,
  )
}

describe("retunement advisor — heirlooms outrank DPS", () => {
  it("withholds the best-DPS recommendation on a piece that already matches a build", () => {
    renderPanel(pieceWith(PERFECT), [row(1, FOREIGN[0], 5000)])

    expect(screen.getByText("Already an heirloom")).toBeInTheDocument()
    expect(screen.queryByText("Best retune")).not.toBeInTheDocument()
  })

  it("recommends the DPS swap on a piece that is not an heirloom", () => {
    const twoOff = [...PERFECT]
    twoOff[1] = FOREIGN[0]
    twoOff[2] = FOREIGN[1]
    renderPanel(pieceWith(twoOff), [row(1, FOREIGN[2], 5000)])

    expect(screen.queryByText("Already an heirloom")).not.toBeInTheDocument()
    expect(screen.getByText("Best retune")).toBeInTheDocument()
  })

  it("puts the retune that makes an heirloom above the DPS pick", () => {
    const oneOff = [...PERFECT]
    oneOff[2] = FOREIGN[0]
    renderPanel(pieceWith(oneOff), [row(1, FOREIGN[1], 5000)])

    const heirloomPick = screen.getByText("Makes it an heirloom")
    const dpsPick = screen.getByText("Best retune")
    expect(heirloomPick.compareDocumentPosition(dpsPick) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })
})
