import { useState } from "react"
import type { GearPiece, GearSlot, Inputs } from "../../../../engine/types"
import {
  decodeGearScreenshot,
  preprocessGearScreenshot,
  recognizeGearScreenshot,
} from "./ocrEngine"
import { parseGearScreenshot, type GearScreenshotFields } from "./ocrGearPiece"

export type ScreenshotCardStatus = "recognizing" | "parsed" | "error"

export interface ScreenshotGearCard {
  id: string
  thumbnailUrl: string
  status: ScreenshotCardStatus
  progress: number
  piece: GearPiece | null
  fields: GearScreenshotFields | null
  errorKey: string | null
}

let cardCounter = 0
function newCardId(): string {
  cardCounter = (cardCounter + 1) | 0
  return `sc-${Date.now().toString(36)}-${cardCounter.toString(36)}`
}

export function useScreenshotGearDraft(inputs: Inputs, fallbackSlot: GearSlot) {
  const [cards, setCards] = useState<ScreenshotGearCard[]>([])

  function patchCard(id: string, patch: Partial<ScreenshotGearCard>): void {
    setCards((previous) => previous.map((card) => (card.id === id ? { ...card, ...patch } : card)))
  }

  async function addImage(file: File | Blob): Promise<void> {
    const id = newCardId()
    const thumbnailUrl = URL.createObjectURL(file)
    setCards((previous) => [
      ...previous,
      {
        id,
        thumbnailUrl,
        status: "recognizing",
        progress: 0,
        piece: null,
        fields: null,
        errorKey: null,
      },
    ])

    try {
      const bitmap = await decodeGearScreenshot(file)
      const canvas = preprocessGearScreenshot(bitmap)
      const text = await recognizeGearScreenshot(canvas, (progress) => patchCard(id, { progress }))
      const parsed = parseGearScreenshot(text, inputs, fallbackSlot)
      if (parsed.error) {
        patchCard(id, {
          status: "error",
          errorKey:
            parsed.error === "empty"
              ? "gear.screenshotImport.noTextFound"
              : "gear.screenshotImport.unreadableImage",
        })
      } else {
        patchCard(id, { status: "parsed", piece: parsed.piece, fields: parsed.fields })
      }
    } catch {
      patchCard(id, { status: "error", errorKey: "gear.screenshotImport.recognitionFailed" })
    }
  }

  function removeCard(id: string): void {
    setCards((previous) => {
      const target = previous.find((card) => card.id === id)
      if (target) URL.revokeObjectURL(target.thumbnailUrl)
      return previous.filter((card) => card.id !== id)
    })
  }

  function updatePiece(id: string, piece: GearPiece): void {
    patchCard(id, { piece })
  }

  function reset(): void {
    for (const card of cards) URL.revokeObjectURL(card.thumbnailUrl)
    setCards([])
  }

  const pieces = cards
    .map((card) => card.piece)
    .filter((piece): piece is GearPiece => piece !== null)

  return { cards, addImage, removeCard, updatePiece, pieces, reset }
}

export type ScreenshotGearDraft = ReturnType<typeof useScreenshotGearDraft>
