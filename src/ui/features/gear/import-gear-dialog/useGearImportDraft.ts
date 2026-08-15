import { useMemo, useState } from "react"
import type { GearLevel, GearPiece, GearRarity, Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import {
  AFFIX_MAPPINGS_FILE_NAME,
  exportAffixChoices,
  loadAffixChoices,
  parseAffixChoicesFile,
  saveAffixChoices,
} from "./affixChoiceStore"
import {
  GearImportError,
  buildImportDiagnostics,
  parseDashboardGearPayload,
  previewablePieces,
  summarizeImport,
  type GearImportResult,
  type ImportedPiece,
} from "./dashboardGearPayload"
import {
  resolveAgainstBuild,
  toGearPieces,
  type AffixChoices,
  type IdentityOverrides,
} from "./importedGearPieces"
import { toMindMethods } from "./importedInnerWays"

export function useGearImportDraft(inputs: Inputs) {
  const { t } = useI18n()
  const [pasted, setPasted] = useState("")
  const [overrides, setOverrides] = useState<IdentityOverrides>({})
  const [choices, setChoices] = useState<AffixChoices>(loadAffixChoices)
  const [copyNotice, setCopyNotice] = useState("")

  const parsed = useMemo((): { result: GearImportResult | null; error: string } => {
    if (!pasted.trim()) return { result: null, error: "" }
    try {
      return {
        result: resolveAgainstBuild(parseDashboardGearPayload(pasted), inputs, choices),
        error: "",
      }
    } catch (failure) {
      if (failure instanceof GearImportError) return { result: null, error: failure.message }
      throw failure
    }
  }, [pasted, inputs, choices])

  const result = parsed.result
  const summary = useMemo(() => (result ? summarizeImport(result) : null), [result])
  const pieces = useMemo(
    (): GearPiece[] => (result ? toGearPieces(result, overrides) : []),
    [result, overrides],
  )
  const shown = useMemo((): ImportedPiece[] => (result ? previewablePieces(result) : []), [result])
  const innerWays = result?.innerWays ?? []
  const mindMethods = useMemo(() => (result ? toMindMethods(result.innerWays) : null), [result])

  function setOverride(
    gameSlotId: string,
    patch: { level?: GearLevel; rarity?: GearRarity },
  ): void {
    setOverrides((previous) => ({
      ...previous,
      [gameSlotId]: { ...previous[gameSlotId], ...patch },
    }))
  }

  function clearPaste(): void {
    setPasted("")
    setOverrides({})
    setCopyNotice("")
  }

  function commitChoices(next: AffixChoices): void {
    setChoices(next)
    saveAffixChoices(next)
  }

  function chooseTarget(affixId: string, key: string): void {
    commitChoices({ ...choices, [affixId]: key })
  }

  function exportMappings(): void {
    const url = URL.createObjectURL(
      new Blob([exportAffixChoices(choices)], { type: "application/json" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = AFFIX_MAPPINGS_FILE_NAME
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importMappings(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      const loaded = parseAffixChoicesFile(await file.text())
      commitChoices({ ...choices, ...loaded })
      setCopyNotice(`${Object.keys(loaded).length} ${t("mappings loaded.")}`)
    } catch (failure) {
      setCopyNotice(failure instanceof Error ? failure.message : String(failure))
    }
  }

  async function copyDiagnostics(): Promise<void> {
    if (!result) return
    try {
      await navigator.clipboard.writeText(buildImportDiagnostics(result))
      setCopyNotice(t("Diagnostics copied — they contain no account details."))
    } catch {
      setCopyNotice(t("Copying failed — select the text and copy it manually."))
    }
  }

  return {
    pasted,
    setPasted,
    clearPaste,
    parseError: parsed.error,
    result,
    summary,
    pieces,
    shown,
    innerWays,
    mindMethods,
    overrides,
    setOverride,
    choices,
    chooseTarget,
    exportMappings,
    importMappings,
    copyNotice,
    copyDiagnostics,
  }
}

export type GearImportDraft = ReturnType<typeof useGearImportDraft>
