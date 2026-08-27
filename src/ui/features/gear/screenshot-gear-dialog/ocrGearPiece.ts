import type { AttunementOption } from "../../../../engine/attunements"
import { attunementsFor } from "../../../../engine/attunements"
import { relayedCapValue } from "../../../../engine/gearStats"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import {
  GEAR_WORD_LINES,
  GEAR_WORD_MAX_ROLL,
  GEAR_WORD_UNIT,
} from "../../../../data/stats/statLines"
import type { GearWordId } from "../../../../data/stats/statLines"
import { emptyGearWord } from "../../../../engine/types"
import type {
  GearLevel,
  GearPiece,
  GearSlot,
  GearWordEntry,
  Inputs,
} from "../../../../engine/types"
import { newGearPieceId, sanitizeGearPieceText } from "../../../../storage"

export type GearScreenshotFieldConfidence = "read" | "guessed" | "unresolved"

export interface GearScreenshotRowReport {
  confidence: GearScreenshotFieldConfidence
  rawText: string
}

export interface GearScreenshotFields {
  slot: GearScreenshotFieldConfidence
  level: GearScreenshotFieldConfidence
  words: [
    GearScreenshotRowReport,
    GearScreenshotRowReport,
    GearScreenshotRowReport,
    GearScreenshotRowReport,
    GearScreenshotRowReport,
  ]
  attunement: GearScreenshotRowReport
}

export type GearScreenshotParseError = "empty" | "unreadable"

export interface GearScreenshotParse {
  piece: GearPiece
  fields: GearScreenshotFields
  error: GearScreenshotParseError | null
}

const VALID_LEVELS: readonly GearLevel[] = [86, 91, 96]
const FALLBACK_LEVEL: GearLevel = 96
const FALLBACK_RARITY: GearPiece["rarity"] = "legendary"

const SLOT_NAME_TO_ID: Readonly<Record<string, GearSlot>> = {
  helm: "helm",
  armor: "armor",
  greaves: "greaves",
  bracer: "bracer",
  disc: "disc",
  pendant: "pendant",
}

const RETUNE_BRACKET_WORDS: ReadonlySet<string> = new Set([
  "turn",
  "turned",
  "tune",
  "tuned",
  "retune",
  "retuned",
])

const MAX_NAME_EDIT_DISTANCE = 2

function normalizeStatName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

interface NormalizedNameEntry<T> {
  normalized: string
  value: T
}

const GEAR_WORD_NAME_INDEX: readonly NormalizedNameEntry<GearWordId>[] = GEAR_WORD_LINES.map(
  (line) => ({ normalized: normalizeStatName(line.label), value: line.id as GearWordId }),
)

function attunementNameIndex(
  slot: GearSlot,
  classId: string,
): readonly NormalizedNameEntry<AttunementOption>[] {
  const entries: NormalizedNameEntry<AttunementOption>[] = []
  for (const option of attunementsFor(slot, classId)) {
    entries.push({ normalized: normalizeStatName(option.label), value: option })
    for (const label of Object.values(option.labelByClass ?? {})) {
      entries.push({ normalized: normalizeStatName(label), value: option })
    }
  }
  return entries
}

function levenshteinDistance(left: string, right: string): number {
  const distances: number[][] = Array.from({ length: left.length + 1 }, () =>
    new Array<number>(right.length + 1).fill(0),
  )
  for (let row = 0; row <= left.length; row += 1) distances[row]![0] = row
  for (let col = 0; col <= right.length; col += 1) distances[0]![col] = col
  for (let row = 1; row <= left.length; row += 1) {
    for (let col = 1; col <= right.length; col += 1) {
      const substitutionCost = left[row - 1] === right[col - 1] ? 0 : 1
      distances[row]![col] = Math.min(
        distances[row - 1]![col]! + 1,
        distances[row]![col - 1]! + 1,
        distances[row - 1]![col - 1]! + substitutionCost,
      )
    }
  }
  return distances[left.length]![right.length]!
}

function resolveByName<T>(name: string, index: readonly NormalizedNameEntry<T>[]): T | null {
  const normalized = normalizeStatName(name)
  if (!normalized) return null
  const exactMatch = index.find((entry) => entry.normalized === normalized)
  if (exactMatch) return exactMatch.value
  let nearest: { value: T; distance: number } | null = null
  for (const entry of index) {
    const distance = levenshteinDistance(normalized, entry.normalized)
    if (distance <= MAX_NAME_EDIT_DISTANCE && (!nearest || distance < nearest.distance)) {
      nearest = { value: entry.value, distance }
    }
  }
  return nearest ? nearest.value : null
}

interface StatRowValue {
  magnitude: number
  isPercent: boolean
}

const STAT_ROW_PATTERN = /^(.*?)\s*([+-]?\d+(?:\.\d+)?)\s*(%)?$/

function matchStatRow(text: string): { name: string; value: StatRowValue } | null {
  const match = STAT_ROW_PATTERN.exec(text)
  if (!match) return null
  return {
    name: match[1]!.trim(),
    value: { magnitude: Number(match[2]), isPercent: !!match[3] },
  }
}

interface ParsedStatRow {
  name: string
  value: StatRowValue | null
  retuned: boolean
  retuneBracketRecognized: boolean
}

function parseStatRow(row: string): ParsedStatRow {
  let remaining = row
  let retuned = false
  let retuneBracketRecognized = true
  const bracketMatch = /^\[([^\]]*)\]\s*/.exec(remaining)
  if (bracketMatch) {
    retuned = true
    retuneBracketRecognized = RETUNE_BRACKET_WORDS.has(bracketMatch[1]!.trim().toLowerCase())
    remaining = remaining.slice(bracketMatch[0].length)
  }
  const matched = matchStatRow(remaining)
  return {
    name: matched?.name ?? remaining.trim(),
    value: matched?.value ?? null,
    retuned,
    retuneBracketRecognized,
  }
}

function joinWrappedRows(lines: readonly string[]): string[] {
  const rows: string[] = []
  let pending = ""
  for (const line of lines) {
    pending = pending ? `${pending} ${line}` : line
    if (matchStatRow(pending)) {
      rows.push(pending)
      pending = ""
    }
  }
  if (pending) rows.push(pending)
  return rows
}

function roundGearWordValue(value: number, isPercent: boolean): number {
  return isPercent ? Math.round(value * 10000) / 10000 : Math.round(value * 100) / 100
}

function roundAttunementValue(value: number): number {
  return Math.round(value * 1000) / 1000
}

function guessSlot(titleLine: string, fallbackSlot: GearSlot): { slot: GearSlot; read: boolean } {
  const words = titleLine.trim().split(/\s+/)
  const lastWord = words[words.length - 1]?.toLowerCase() ?? ""
  const matched = SLOT_NAME_TO_ID[lastWord]
  return matched ? { slot: matched, read: true } : { slot: fallbackSlot, read: false }
}

function parseLevel(headerLine: string): { level: GearLevel; read: boolean } {
  const match = /tier\s*(\d+)/i.exec(headerLine)
  const candidate = match ? Number(match[1]) : null
  const isValidLevel = candidate !== null && VALID_LEVELS.includes(candidate as GearLevel)
  return isValidLevel
    ? { level: candidate as GearLevel, read: true }
    : { level: FALLBACK_LEVEL, read: false }
}

function emptyDraft(fallbackSlot: GearSlot): GearPiece {
  const base = gearBaseStatsFor({
    slot: fallbackSlot,
    level: FALLBACK_LEVEL,
    rarity: FALLBACK_RARITY,
  })
  return {
    id: newGearPieceId(),
    slot: fallbackSlot,
    level: FALLBACK_LEVEL,
    rarity: FALLBACK_RARITY,
    minPhys: base.minPhys,
    maxPhys: base.maxPhys,
    hp: base.hp,
    physDef: base.physDef,
    words: [
      emptyGearWord(),
      emptyGearWord(),
      emptyGearWord(),
      emptyGearWord(),
      emptyGearWord(),
    ] as GearPiece["words"],
    attunement: "",
    attunementValue: 0,
    relayed: false,
    isNew: true,
  }
}

function emptyReport(rawText = ""): GearScreenshotRowReport {
  return { confidence: "unresolved", rawText }
}

function emptyParse(fallbackSlot: GearSlot, error: GearScreenshotParseError): GearScreenshotParse {
  return {
    piece: emptyDraft(fallbackSlot),
    fields: {
      slot: "guessed",
      level: "guessed",
      words: [emptyReport(), emptyReport(), emptyReport(), emptyReport(), emptyReport()],
      attunement: emptyReport(),
    },
    error,
  }
}

function resolveWordRow(
  rowText: string | undefined,
  relayed: boolean,
): { entry: GearWordEntry; report: GearScreenshotRowReport } {
  if (rowText === undefined) return { entry: emptyGearWord(), report: emptyReport() }

  const parsed = parseStatRow(rowText)
  const wordId = resolveByName(parsed.name, GEAR_WORD_NAME_INDEX)
  const magnitude = parsed.value
    ? parsed.value.isPercent
      ? parsed.value.magnitude / 100
      : parsed.value.magnitude
    : 0

  if (!wordId) {
    return {
      entry: { word: "", value: magnitude, retuned: parsed.retuned },
      report: { confidence: "unresolved", rawText: rowText },
    }
  }

  const cap = GEAR_WORD_MAX_ROLL[wordId]
  const unit = GEAR_WORD_UNIT[wordId]
  const ceiling = relayed ? relayedCapValue(cap, unit) : cap
  const clamped = roundGearWordValue(Math.min(Math.max(magnitude, 0), ceiling), unit === "percent")

  return {
    entry: { word: wordId, value: clamped, retuned: parsed.retuned },
    report: {
      confidence: parsed.retuneBracketRecognized ? "read" : "guessed",
      rawText: rowText,
    },
  }
}

function resolveAttunementRow(
  rowText: string | undefined,
  slot: GearSlot,
  classId: string,
): { attunement: string; attunementValue: number; report: GearScreenshotRowReport } {
  if (rowText === undefined) {
    return { attunement: "", attunementValue: 0, report: emptyReport() }
  }

  const parsed = parseStatRow(rowText)
  const option = resolveByName(parsed.name, attunementNameIndex(slot, classId))
  if (!option || !parsed.value) {
    return {
      attunement: "",
      attunementValue: 0,
      report: { confidence: "unresolved", rawText: rowText },
    }
  }

  const magnitude = parsed.value.magnitude
  const candidates = [magnitude, magnitude / 100]
  const inRange = candidates.find((candidate) => candidate >= option.min && candidate <= option.max)

  return {
    attunement: option.id,
    attunementValue: roundAttunementValue(inRange ?? magnitude),
    report: { confidence: inRange !== undefined ? "read" : "guessed", rawText: rowText },
  }
}

export function parseGearScreenshot(
  text: string,
  inputs: Inputs,
  fallbackSlot: GearSlot,
): GearScreenshotParse {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (lines.length === 0) return emptyParse(fallbackSlot, "empty")

  const [titleLine, headerLine, ...bodyLines] = lines
  const rows = headerLine !== undefined ? joinWrappedRows(bodyLines) : []
  if (rows.length === 0) return emptyParse(fallbackSlot, "unreadable")

  const slotGuess = guessSlot(titleLine!, fallbackSlot)
  const levelGuess = parseLevel(headerLine!)
  const relayed = /relaying/i.test(headerLine!)

  const wordRows = [0, 1, 2, 3, 4].map((index) => resolveWordRow(rows[index], relayed))
  const attunementRow = resolveAttunementRow(rows[5], slotGuess.slot, inputs.classId)

  const base = gearBaseStatsFor({
    slot: slotGuess.slot,
    level: levelGuess.level,
    rarity: FALLBACK_RARITY,
  })
  const label = sanitizeGearPieceText(titleLine, 40)

  const piece: GearPiece = {
    id: newGearPieceId(),
    slot: slotGuess.slot,
    level: levelGuess.level,
    rarity: FALLBACK_RARITY,
    minPhys: base.minPhys,
    maxPhys: base.maxPhys,
    hp: base.hp,
    physDef: base.physDef,
    words: wordRows.map((row) => row.entry) as GearPiece["words"],
    attunement: attunementRow.attunement,
    attunementValue: attunementRow.attunementValue,
    relayed,
    isNew: true,
    ...(label ? { label } : {}),
  }

  return {
    piece,
    fields: {
      slot: slotGuess.read ? "read" : "guessed",
      level: levelGuess.read ? "read" : "guessed",
      words: wordRows.map((row) => row.report) as GearScreenshotFields["words"],
      attunement: attunementRow.report,
    },
    error: null,
  }
}
