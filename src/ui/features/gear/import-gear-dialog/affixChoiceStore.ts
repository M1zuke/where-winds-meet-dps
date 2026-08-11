import { kvStore } from "../../../../kvStore"
import type { AffixChoices } from "./importedGearPieces"

const AFFIX_CHOICES_KEY = "wwm.gearImportAffixChoices"
const FILE_SOURCE = "wwm-gear-affix-mappings"
export const AFFIX_MAPPINGS_FILE_VERSION = 1
export const AFFIX_MAPPINGS_FILE_NAME = "wwm-gear-affix-mappings.json"

function readMappingRecord(value: unknown): AffixChoices {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [affixId, target] of Object.entries(value)) {
    if (typeof target === "string") out[affixId] = target
  }
  return out
}

export function loadAffixChoices(): AffixChoices {
  const stored = kvStore.get(AFFIX_CHOICES_KEY)
  if (!stored) return {}
  try {
    return readMappingRecord(JSON.parse(stored))
  } catch {
    return {}
  }
}

export function saveAffixChoices(choices: AffixChoices): void {
  kvStore.set(AFFIX_CHOICES_KEY, JSON.stringify(choices))
}

/** Keys are sorted so two exports of the same mappings diff cleanly. */
export function exportAffixChoices(choices: AffixChoices): string {
  const mappings: Record<string, string> = {}
  for (const affixId of Object.keys(choices).sort()) mappings[affixId] = choices[affixId]!
  return `${JSON.stringify({ source: FILE_SOURCE, v: AFFIX_MAPPINGS_FILE_VERSION, mappings }, null, 2)}\n`
}

export function parseAffixChoicesFile(text: string): AffixChoices {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("That file is not valid JSON.")
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("That file does not hold stat-line mappings.")
  }

  const envelope = parsed as Record<string, unknown>
  const source = envelope.source
  if (typeof source === "string" && source !== FILE_SOURCE) {
    throw new Error(`That file came from "${source}", not a stat-line mapping export.`)
  }
  const version = envelope.v
  if (typeof version === "number" && version > AFFIX_MAPPINGS_FILE_VERSION) {
    throw new Error(`That file was written by a newer version (v${version}).`)
  }

  // A bare `{ "<affixId>": "word:…" }` object is accepted too, so the table in
  // affixStatLineTable.ts can be pasted straight back in.
  const mappings = readMappingRecord(envelope.mappings ?? envelope)
  if (!Object.keys(mappings).length) throw new Error("That file holds no stat-line mappings.")
  return mappings
}
