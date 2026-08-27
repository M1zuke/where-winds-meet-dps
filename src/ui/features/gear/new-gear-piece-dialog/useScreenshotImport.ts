import { useEffect, useRef, useState } from "react"
import type { GearPiece, GearSlot, Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import {
  decodeGearScreenshot,
  preprocessGearScreenshot,
  recognizeGearScreenshot,
  terminateOcrWorker,
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
  const runRef = useRef(0)

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    }
  }, [])

  function releaseImage(): void {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    imageUrlRef.current = null
  }

  function reset(): void {
    runRef.current += 1
    releaseImage()
    setCopyNotice("")
    setState(IDLE_STATE)
  }

  function cancel(): void {
    reset()
    void terminateOcrWorker()
  }

  async function importImage(source: File | Blob): Promise<void> {
    releaseImage()
    const imageUrl = URL.createObjectURL(source)
    imageUrlRef.current = imageUrl
    runRef.current += 1
    const run = runRef.current
    setCopyNotice("")
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
        setState((previous) => (runRef.current === run ? { ...previous, progress } : previous)),
      )
      if (runRef.current !== run) return
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
      if (runRef.current !== run) return
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

  return { ...state, importImage, cancel, reset, copyNotice, copyDiagnostics }
}
