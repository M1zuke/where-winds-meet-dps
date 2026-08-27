import type { AttunementOption } from "../../../../engine/attunements"
import { ATTUNEMENT_OPTIONS } from "../../../../engine/attunements"
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
  relayed: GearScreenshotFieldConfidence
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

export type GearScreenshotLineRole = "title" | "header" | "row" | "dropped"

export interface GearScreenshotLineDiagnostic {
  text: string
  role: GearScreenshotLineRole
}

export type GearScreenshotRowSlot = "word0" | "word1" | "word2" | "word3" | "word4" | "attunement"

export interface GearScreenshotRowDiagnostic {
  slot: GearScreenshotRowSlot
  rawText: string
  nameAfterNoiseStrip: string
  resolvedTo: string | null
  rawNumber: string
  convertedValue: number | null
  cap: number | null
  legalForClass: boolean | null
  exceededCap: boolean
}

export interface GearScreenshotDiagnostics {
  lines: GearScreenshotLineDiagnostic[]
  rows: GearScreenshotRowDiagnostic[]
}

export interface GearScreenshotParse {
  piece: GearPiece
  fields: GearScreenshotFields
  diagnostics: GearScreenshotDiagnostics
  error: GearScreenshotParseError | null
}

const VALID_LEVELS: readonly GearLevel[] = [86, 91, 96]
const FALLBACK_LEVEL: GearLevel = 96
const FALLBACK_RARITY: GearPiece["rarity"] = "legendary"

// "Charm" and "Ward" are the in-game nouns the piece titles actually use for
// the Disc and Pendant slots.
const SLOT_NAME_TO_ID: Readonly<Record<string, GearSlot>> = {
  helm: "helm",
  armor: "armor",
  greaves: "greaves",
  bracer: "bracer",
  disc: "disc",
  charm: "disc",
  pendant: "pendant",
  ward: "pendant",
}

const RETUNE_BRACKET_WORDS: ReadonlySet<string> = new Set([
  "turn",
  "turned",
  "tune",
  "tuned",
  "retune",
  "retuned",
])

const NAME_DISTANCE_MIN = 2
const NAME_DISTANCE_SCALE = 0.25

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

// Every attunement option, every slot, every class — including labels for
// classes other than the one selected — so a correctly-read attunement is
// never vetoed by a wrong slot guess or a different class being selected.
const ATTUNEMENT_NAME_INDEX: readonly NormalizedNameEntry<AttunementOption>[] =
  ATTUNEMENT_OPTIONS.flatMap((option) => [
    { normalized: normalizeStatName(option.label), value: option },
    ...Object.values(option.labelByClass ?? {}).map((label) => ({
      normalized: normalizeStatName(label),
      value: option,
    })),
  ])

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

function nameDistanceThreshold(normalizedLabel: string): number {
  return Math.max(NAME_DISTANCE_MIN, Math.round(normalizedLabel.length * NAME_DISTANCE_SCALE))
}

// OCR wraps the stat name in junk on both sides, so the name is looked for in
// every window of the row's tokens rather than at a fixed offset. The length
// gap is a lower bound on the distance, so skipping on it changes no match.
function resolveByName<T>(name: string, index: readonly NormalizedNameEntry<T>[]): T | null {
  const tokens = normalizeStatName(name).split(" ").filter(Boolean)
  if (tokens.length === 0) return null

  let nearest: { value: T; distance: number } | null = null
  for (let start = 0; start < tokens.length; start += 1) {
    for (let end = tokens.length; end > start; end -= 1) {
      const candidate = tokens.slice(start, end).join(" ")
      for (const entry of index) {
        if (candidate === entry.normalized) return entry.value
        const threshold = nameDistanceThreshold(entry.normalized)
        if (Math.abs(candidate.length - entry.normalized.length) > threshold) continue
        const distance = levenshteinDistance(candidate, entry.normalized)
        if (distance <= threshold && (!nearest || distance < nearest.distance)) {
          nearest = { value: entry.value, distance }
        }
      }
    }
  }
  return nearest ? nearest.value : null
}

interface StatRowValue {
  magnitude: number
  isPercent: boolean
}

interface NumberToken {
  start: number
  end: number
  sign: string
  digits: string
  percent: boolean
}

const NUMBER_TOKEN_PATTERN = /([+-]?)(\d+(?:\.\d+)?)(%)?/g

function findNumberTokens(text: string): NumberToken[] {
  const tokens: NumberToken[] = []
  for (const match of text.matchAll(NUMBER_TOKEN_PATTERN)) {
    tokens.push({
      start: match.index,
      end: match.index + match[0].length,
      sign: match[1] ?? "",
      digits: match[2]!,
      percent: !!match[3],
    })
  }
  return tokens
}

function isSplitPair(first: NumberToken, second: NumberToken, text: string): boolean {
  return (
    !!first.sign &&
    !first.digits.includes(".") &&
    first.digits.length <= 2 &&
    !second.sign &&
    second.digits.includes(".") &&
    /^\s*$/.test(text.slice(first.end, second.start))
  )
}

// A bare unsigned number (e.g. the "44" inside "rowerr44o") never carries a
// value on its own — a stray digit in OCR noise, not a stat. OCR also
// sometimes drops a value's decimal run onto its own token, e.g. "+7 3.1"
// for 73.1 — measured on mirageSentinel.png.
function matchStatRow(text: string): { name: string; value: StatRowValue | null } | null {
  const tokens = findNumberTokens(text)
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index]!
    if (!token.sign) continue

    const next = tokens[index + 1]
    const paired = next && isSplitPair(token, next, text)
    const magnitude = paired
      ? Number(`${token.sign}${token.digits}${next!.digits}`)
      : Number(`${token.sign}${token.digits}`)
    const percent = paired ? next!.percent : token.percent

    return { name: text.slice(0, token.start).trim(), value: { magnitude, isPercent: percent } }
  }
  // Unsigned digits still mark where the name ends, even though they are not
  // trusted as its value.
  const nameEnd = tokens[0] ? tokens[0].start : text.length
  const nameOnly = text.slice(0, nameEnd).trim()
  return nameOnly ? { name: nameOnly, value: null } : null
}

function stripRetuneBracket(row: string): {
  remaining: string
  retuned: boolean
  recognized: boolean
} {
  const openIndex = row.search(/[[({]/)
  if (openIndex < 0) return { remaining: row, retuned: false, recognized: true }

  const afterOpen = row.slice(openIndex + 1)
  const wordMatch = /^\s*([a-zA-Z]+)/.exec(afterOpen)
  if (!wordMatch) return { remaining: row, retuned: false, recognized: true }

  const bracketWord = wordMatch[1]!
  const recognized = RETUNE_BRACKET_WORDS.has(bracketWord.toLowerCase())
  const restAfterWord = afterOpen.slice(wordMatch[0].length)
  // An unrecognised word only counts as a misread bracket tag when a closing
  // bracket sits right after it — otherwise this is an opening-bracket-shaped
  // OCR artefact ahead of the real stat name, and that name must not be
  // mistaken for a retune marker and stripped away.
  if (!recognized && !/^[\])}]/.test(restAfterWord)) {
    return { remaining: row, retuned: false, recognized: true }
  }
  const remaining = restAfterWord.replace(/^\s*[\])}]/, "").trimStart()
  return { remaining, retuned: true, recognized }
}

interface RowSegment {
  text: string
  sourceLines: readonly string[]
}

function selectRows(lines: readonly string[]): {
  rows: RowSegment[]
  trailing: RowSegment | undefined
} {
  const rows: RowSegment[] = []
  let pending: RowSegment = { text: "", sourceLines: [] }
  for (const line of lines) {
    const text = pending.text ? `${pending.text} ${line}` : line
    const sourceLines = [...pending.sourceLines, line]
    if (matchStatRow(text)?.value) {
      rows.push({ text, sourceLines })
      pending = { text: "", sourceLines: [] }
    } else {
      pending = { text, sourceLines }
    }
  }
  return { rows, trailing: pending.text ? pending : undefined }
}

function roundGearWordValue(value: number, isPercent: boolean): number {
  return isPercent ? Math.round(value * 10000) / 10000 : Math.round(value * 100) / 100
}

function roundAttunementValue(value: number): number {
  return Math.round(value * 1000) / 1000
}

function guessSlot(titleLine: string, fallbackSlot: GearSlot): { slot: GearSlot; read: boolean } {
  const words = titleLine
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean)
  for (let index = words.length - 1; index >= 0; index -= 1) {
    const word = words[index]!
    const matched =
      SLOT_NAME_TO_ID[word] ?? (word.endsWith("s") ? SLOT_NAME_TO_ID[word.slice(0, -1)] : undefined)
    if (matched) return { slot: matched, read: true }
  }
  return { slot: fallbackSlot, read: false }
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

function emptyParse(
  fallbackSlot: GearSlot,
  error: GearScreenshotParseError,
  lines: GearScreenshotLineDiagnostic[] = [],
): GearScreenshotParse {
  return {
    piece: emptyDraft(fallbackSlot),
    fields: {
      slot: "guessed",
      level: "guessed",
      relayed: "guessed",
      words: [emptyReport(), emptyReport(), emptyReport(), emptyReport(), emptyReport()],
      attunement: emptyReport(),
    },
    diagnostics: { lines, rows: [] },
    error,
  }
}

interface ParsedWordCandidate {
  wordId: GearWordId | null
  magnitude: number
  retuned: boolean
  retuneBracketRecognized: boolean
  rawText: string
  nameAfterNoiseStrip: string
  rawNumber: string
  provesNotRelayed: boolean
}

function displayNumber(value: StatRowValue): string {
  return `${value.magnitude}${value.isPercent ? "%" : ""}`
}

function parseWordCandidate(rowText: string | undefined): ParsedWordCandidate | undefined {
  if (rowText === undefined) return undefined

  const bracket = stripRetuneBracket(rowText)
  const matched = matchStatRow(bracket.remaining)
  const wordId = matched ? resolveByName(matched.name, GEAR_WORD_NAME_INDEX) : null
  const magnitude = matched?.value
    ? matched.value.isPercent
      ? matched.value.magnitude / 100
      : matched.value.magnitude
    : 0

  let provesNotRelayed = false
  if (wordId) {
    const cap = GEAR_WORD_MAX_ROLL[wordId]
    const relayedCeiling = relayedCapValue(cap, GEAR_WORD_UNIT[wordId])
    provesNotRelayed = magnitude > relayedCeiling && magnitude <= cap
  }

  return {
    wordId,
    magnitude,
    retuned: bracket.retuned,
    retuneBracketRecognized: bracket.recognized,
    rawText: rowText,
    nameAfterNoiseStrip: matched?.name ?? "",
    rawNumber: matched?.value ? displayNumber(matched.value) : "",
    provesNotRelayed,
  }
}

function emptyRowDiagnostic(slot: GearScreenshotRowSlot): GearScreenshotRowDiagnostic {
  return {
    slot,
    rawText: "",
    nameAfterNoiseStrip: "",
    resolvedTo: null,
    rawNumber: "",
    convertedValue: null,
    cap: null,
    legalForClass: null,
    exceededCap: false,
  }
}

function finalizeWordRow(
  slot: GearScreenshotRowSlot,
  candidate: ParsedWordCandidate | undefined,
  relayed: boolean,
): {
  entry: GearWordEntry
  report: GearScreenshotRowReport
  diagnostic: GearScreenshotRowDiagnostic
} {
  if (!candidate) {
    return { entry: emptyGearWord(), report: emptyReport(), diagnostic: emptyRowDiagnostic(slot) }
  }

  const baseDiagnostic = {
    slot,
    rawText: candidate.rawText,
    nameAfterNoiseStrip: candidate.nameAfterNoiseStrip,
    rawNumber: candidate.rawNumber,
  }

  if (!candidate.wordId) {
    return {
      entry: { word: "", value: candidate.magnitude, retuned: candidate.retuned },
      report: { confidence: "unresolved", rawText: candidate.rawText },
      diagnostic: {
        ...baseDiagnostic,
        resolvedTo: null,
        convertedValue: null,
        cap: null,
        exceededCap: false,
        legalForClass: null,
      },
    }
  }

  const cap = GEAR_WORD_MAX_ROLL[candidate.wordId]
  const unit = GEAR_WORD_UNIT[candidate.wordId]
  const ceiling = relayed ? relayedCapValue(cap, unit) : cap

  const withinCeiling = candidate.magnitude <= ceiling
  const value = roundGearWordValue(Math.max(candidate.magnitude, 0), unit === "percent")

  // A value above its ceiling is never clamped into legality: the read digits
  // stay as read, and the row is flagged instead, because clamping would
  // silently overwrite a value that was actually read off the screenshot.
  return {
    entry: { word: candidate.wordId, value, retuned: candidate.retuned },
    report: {
      confidence: withinCeiling && candidate.retuneBracketRecognized ? "read" : "guessed",
      rawText: candidate.rawText,
    },
    diagnostic: {
      ...baseDiagnostic,
      resolvedTo: candidate.wordId,
      convertedValue: value,
      cap: ceiling,
      exceededCap: !withinCeiling,
      legalForClass: null,
    },
  }
}

function resolveAttunementRow(
  rowText: string | undefined,
  classId: string,
): {
  attunement: string
  attunementValue: number
  report: GearScreenshotRowReport
  diagnostic: GearScreenshotRowDiagnostic
  matchedSlots: readonly GearSlot[] | null
} {
  if (rowText === undefined) {
    return {
      attunement: "",
      attunementValue: 0,
      report: emptyReport(),
      diagnostic: emptyRowDiagnostic("attunement"),
      matchedSlots: null,
    }
  }

  const bracket = stripRetuneBracket(rowText)
  const matched = matchStatRow(bracket.remaining)
  const baseDiagnostic = {
    slot: "attunement" as const,
    rawText: rowText,
    nameAfterNoiseStrip: matched?.name ?? "",
    rawNumber: matched?.value ? displayNumber(matched.value) : "",
  }

  const rowValue = matched?.value ?? null
  const option = matched ? resolveByName(matched.name, ATTUNEMENT_NAME_INDEX) : null
  if (!option) {
    // An unnamed row with no value is an attuning-affix slot that has not been
    // rolled yet, a normal state, not a failed read.
    return {
      attunement: "",
      attunementValue: 0,
      report: {
        confidence: rowValue ? "unresolved" : "read",
        rawText: rowText,
      },
      diagnostic: {
        ...baseDiagnostic,
        resolvedTo: null,
        convertedValue: null,
        cap: null,
        legalForClass: null,
        exceededCap: false,
      },
      matchedSlots: null,
    }
  }

  const legalForClass = !option.classIds || option.classIds.includes(classId)

  if (!rowValue) {
    return {
      attunement: legalForClass ? option.id : "",
      attunementValue: 0,
      report: { confidence: "unresolved", rawText: rowText },
      diagnostic: {
        ...baseDiagnostic,
        resolvedTo: option.id,
        convertedValue: null,
        cap: option.max,
        legalForClass,
        exceededCap: false,
      },
      matchedSlots: option.slots,
    }
  }
  const magnitude = rowValue.magnitude
  const candidates = [magnitude, magnitude / 100, magnitude / 1000]
  const inRange = candidates.find((candidate) => candidate >= option.min && candidate <= option.max)
  const attunementValue = roundAttunementValue(inRange ?? magnitude)
  const diagnostic: GearScreenshotRowDiagnostic = {
    ...baseDiagnostic,
    resolvedTo: option.id,
    convertedValue: attunementValue,
    cap: option.max,
    legalForClass,
    exceededCap: inRange === undefined,
  }

  // Never written to the piece (that would store an illegal build), but
  // reported explicitly rather than left silent — "read, wrong class" must
  // stay distinguishable from "not read at all".
  if (!legalForClass) {
    return {
      attunement: "",
      attunementValue: 0,
      report: { confidence: "guessed", rawText: rowText },
      diagnostic,
      matchedSlots: option.slots,
    }
  }

  return {
    attunement: option.id,
    attunementValue,
    report: { confidence: inRange !== undefined ? "read" : "guessed", rawText: rowText },
    diagnostic,
    matchedSlots: option.slots,
  }
}

function buildLineDiagnostics(
  lines: readonly string[],
  headerIndexInRest: number,
  bodyLineRoles: readonly ("row" | "dropped")[],
): GearScreenshotLineDiagnostic[] {
  let bodyCursor = 0
  return lines.map((lineText, index) => {
    const role: GearScreenshotLineRole =
      index === 0
        ? "title"
        : index - 1 === headerIndexInRest
          ? "header"
          : (bodyLineRoles[bodyCursor++] ?? "dropped")
    return { text: lineText, role }
  })
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

  const [titleLine, ...rest] = lines
  const headerIndex = rest.findIndex((line) => /relaying|tier\s*\d/i.test(line))
  const headerLine = headerIndex >= 0 ? rest[headerIndex] : undefined
  const bodyLines =
    headerIndex >= 0 ? [...rest.slice(0, headerIndex), ...rest.slice(headerIndex + 1)] : rest

  const { rows, trailing } = selectRows(bodyLines)
  if (rows.length === 0 && !trailing) {
    const bodyLineRoles = bodyLines.map(() => "dropped" as const)
    return emptyParse(
      fallbackSlot,
      "unreadable",
      buildLineDiagnostics(lines, headerIndex, bodyLineRoles),
    )
  }

  let slotGuess = guessSlot(titleLine!, fallbackSlot)
  const levelGuess = parseLevel(headerLine ?? "")
  const headerRelayedGuess = headerLine ? /relaying/i.test(headerLine) : false

  // A gear piece always has exactly five word slots: an unread row is an
  // empty, editable slot, never a shorter array — so each index is looked up
  // explicitly rather than mapped over however many rows were recognised.
  const rowTexts = [rows[0]?.text, rows[1]?.text, rows[2]?.text, rows[3]?.text, rows[4]?.text]
  const wordCandidates: [
    ParsedWordCandidate | undefined,
    ParsedWordCandidate | undefined,
    ParsedWordCandidate | undefined,
    ParsedWordCandidate | undefined,
    ParsedWordCandidate | undefined,
  ] = [
    parseWordCandidate(rowTexts[0]),
    parseWordCandidate(rowTexts[1]),
    parseWordCandidate(rowTexts[2]),
    parseWordCandidate(rowTexts[3]),
    parseWordCandidate(rowTexts[4]),
  ]
  const notRelayedProven =
    headerRelayedGuess && wordCandidates.some((candidate) => candidate?.provesNotRelayed)
  const relayed = notRelayedProven ? false : headerRelayedGuess

  const wordSlots: GearScreenshotRowSlot[] = ["word0", "word1", "word2", "word3", "word4"]
  const wordRows: [
    ReturnType<typeof finalizeWordRow>,
    ReturnType<typeof finalizeWordRow>,
    ReturnType<typeof finalizeWordRow>,
    ReturnType<typeof finalizeWordRow>,
    ReturnType<typeof finalizeWordRow>,
  ] = [
    finalizeWordRow(wordSlots[0]!, wordCandidates[0], relayed),
    finalizeWordRow(wordSlots[1]!, wordCandidates[1], relayed),
    finalizeWordRow(wordSlots[2]!, wordCandidates[2], relayed),
    finalizeWordRow(wordSlots[3]!, wordCandidates[3], relayed),
    finalizeWordRow(wordSlots[4]!, wordCandidates[4], relayed),
  ]

  const attunementIsTrailing = rows.length <= 5
  const attunementRowText = attunementIsTrailing ? trailing?.text : rows[rows.length - 1]!.text
  const attunementRow = resolveAttunementRow(attunementRowText, inputs.classId)

  // The attunement is evidence about the slot, not something a wrong guess vetoes:
  // when the title named no slot and the matched attunement disagrees with the
  // fallback guess, the attunement wins.
  if (
    !slotGuess.read &&
    attunementRow.matchedSlots &&
    !attunementRow.matchedSlots.includes(slotGuess.slot)
  ) {
    slotGuess = { slot: attunementRow.matchedSlots[0]!, read: true }
  }

  const bodyLineRoles: ("row" | "dropped")[] = []
  for (const row of rows) for (const _line of row.sourceLines) bodyLineRoles.push("row")
  if (trailing) {
    for (const _line of trailing.sourceLines) {
      bodyLineRoles.push(attunementIsTrailing ? "row" : "dropped")
    }
  }

  const base = gearBaseStatsFor({
    slot: slotGuess.slot,
    level: levelGuess.level,
    rarity: FALLBACK_RARITY,
  })
  const label = sanitizeGearPieceText(titleLine!, 40)

  const piece: GearPiece = {
    id: newGearPieceId(),
    slot: slotGuess.slot,
    level: levelGuess.level,
    rarity: FALLBACK_RARITY,
    minPhys: base.minPhys,
    maxPhys: base.maxPhys,
    hp: base.hp,
    physDef: base.physDef,
    words: [
      wordRows[0].entry,
      wordRows[1].entry,
      wordRows[2].entry,
      wordRows[3].entry,
      wordRows[4].entry,
    ],
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
      relayed: notRelayedProven ? "read" : "guessed",
      words: [
        wordRows[0].report,
        wordRows[1].report,
        wordRows[2].report,
        wordRows[3].report,
        wordRows[4].report,
      ],
      attunement: attunementRow.report,
    },
    diagnostics: {
      lines: buildLineDiagnostics(lines, headerIndex, bodyLineRoles),
      rows: [
        wordRows[0].diagnostic,
        wordRows[1].diagnostic,
        wordRows[2].diagnostic,
        wordRows[3].diagnostic,
        wordRows[4].diagnostic,
        attunementRow.diagnostic,
      ],
    },
    error: null,
  }
}

export function buildScreenshotDiagnosticsText(diagnostics: GearScreenshotDiagnostics): string {
  return JSON.stringify(diagnostics, null, 2)
}
