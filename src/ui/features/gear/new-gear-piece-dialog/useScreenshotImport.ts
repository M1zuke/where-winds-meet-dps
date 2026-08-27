import { useEffect, useRef, useState } from "react"
import type { GearPiece, GearSlot, Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import {
  decodeGearScreenshot,
  preprocessGearScreenshot,
  recognizeGearScreenshot,
} from "../screenshot-ocr/ocrEngine"
import {
  buildScreenshotDiagnosticsText,
  parseGearScreenshot,
  type GearScreenshotDiagnostics,
  type GearScreenshotFields,
  type GearScreenshotParseError,
} from "../screenshot-ocr/ocrGearPiece"

export type ScreenshotImportStatus = "idle" | "recognizing" | "parsed" | "error"
export type ScreenshotImportErrorKind = GearScreenshotParseError | "recognitionFailed"

export interface ScreenshotImportState {
  status: ScreenshotImportStatus
  progress: number
  fields: GearScreenshotFields | null
  diagnostics: GearScreenshotDiagnostics | null
  errorKind: ScreenshotImportErrorKind | null
  imageUrl: string | null
}

const IDLE_STATE: ScreenshotImportState = {
  status: "idle",
  progress: 0,
  fields: null,
  diagnostics: null,
  errorKind: null,
  imageUrl: null,
}

export function useScreenshotImport(
  inputs: Inputs,
  fallbackSlot: GearSlot,
  onParsed: (piece: GearPiece, fields: GearScreenshotFields) => void,
) {
  const { t } = useI18n()
  const [state, setState] = useState<ScreenshotImportState>(IDLE_STATE)
  const [copyNotice, setCopyNotice] = useState("")
  const imageUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    }
  }, [])

  async function importImage(source: File | Blob): Promise<void> {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    const imageUrl = URL.createObjectURL(source)
    imageUrlRef.current = imageUrl
    setState({
      status: "recognizing",
      progress: 0,
      fields: null,
      diagnostics: null,
      errorKind: null,
      imageUrl,
    })
    try {
      const bitmap = await decodeGearScreenshot(source)
      const canvas = preprocessGearScreenshot(bitmap)
      const text = await recognizeGearScreenshot(canvas, (progress) =>
        setState((previous) => ({ ...previous, progress })),
      )
      const parsed = parseGearScreenshot(text, inputs, fallbackSlot)
      if (parsed.error) {
        setState({
          status: "error",
          progress: 1,
          fields: null,
          diagnostics: parsed.diagnostics,
          errorKind: parsed.error,
          imageUrl,
        })
        return
      }
      setState({
        status: "parsed",
        progress: 1,
        fields: parsed.fields,
        diagnostics: parsed.diagnostics,
        errorKind: null,
        imageUrl,
      })
      onParsed(parsed.piece, parsed.fields)
    } catch {
      setState({
        status: "error",
        progress: 1,
        fields: null,
        diagnostics: null,
        errorKind: "recognitionFailed",
        imageUrl,
      })
    }
  }

  async function copyDiagnostics(): Promise<void> {
    if (!state.diagnostics) return
    try {
      await navigator.clipboard.writeText(buildScreenshotDiagnosticsText(state.diagnostics))
      setCopyNotice(t("gear.importGearDialog.diagnosticsCopiedTheyContainNo"))
    } catch {
      setCopyNotice(t("gear.importGearDialog.copyingFailedSelectTheText"))
    }
  }

  return { ...state, importImage, copyNotice, copyDiagnostics }
}
