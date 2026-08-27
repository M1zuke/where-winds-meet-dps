import type { ScanFieldMark, ScanMarks } from "../gear-piece-form/GearPieceForm"
import type {
  GearScreenshotDiagnostics,
  GearScreenshotFieldConfidence,
  GearScreenshotFields,
  GearScreenshotRowDiagnostic,
  GearScreenshotRowReport,
} from "../screenshot-ocr/ocrGearPiece"

export interface ScanSummary {
  marks: ScanMarks
  flaggedCount: number
}

const EMPTY_SUMMARY: ScanSummary = { marks: {}, flaggedCount: 0 }

function markFor(
  report: GearScreenshotRowReport,
  diagnostic: GearScreenshotRowDiagnostic | undefined,
): ScanFieldMark | null {
  if (report.confidence === "read") return null
  if (!report.rawText && !diagnostic?.rawText) return null
  const nameResolved = Boolean(diagnostic?.resolvedTo)
  return { level: report.confidence, name: !nameResolved, value: true }
}

function identityMark(confidence: GearScreenshotFieldConfidence): ScanFieldMark | null {
  return confidence === "read" ? null : { level: confidence, name: true, value: false }
}

export function buildScanSummary(
  fields: GearScreenshotFields | null,
  diagnostics: GearScreenshotDiagnostics | null,
): ScanSummary {
  if (!fields) return EMPTY_SUMMARY

  const marks: Record<string, ScanFieldMark> = {}

  const slotMark = identityMark(fields.slot)
  if (slotMark) marks.slot = slotMark
  const levelMark = identityMark(fields.level)
  if (levelMark) marks.level = levelMark

  function diagnosticFor(slot: string): GearScreenshotRowDiagnostic | undefined {
    return diagnostics?.rows.find((row) => row.slot === slot)
  }

  fields.words.forEach((report, index) => {
    const mark = markFor(report, diagnosticFor(`word${index}`))
    if (mark) marks[`word${index}`] = mark
  })

  const attunementMark = markFor(fields.attunement, diagnosticFor("attunement"))
  if (attunementMark) marks.attunement = attunementMark

  return { marks, flaggedCount: Object.keys(marks).length }
}
