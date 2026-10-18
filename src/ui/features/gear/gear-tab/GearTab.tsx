import { useState } from "react"
import type {
  BowGear,
  BowGearLevel,
  BowPiece,
  BowSlot,
  EquippedSlots,
  GearPiece,
  GearSlot,
  Inputs,
} from "../../../../engine/types"
import { BOW_SLOTS, GEAR_SLOTS, isWeaponSlot } from "../../../../engine/types"
import { gearLevelForBreakthrough } from "../../../../definitions/baseStats/breakthroughs"
import { withSetChoice } from "../../../../engine/setChoice"
import { useI18n } from "../../../../i18n/i18nContext"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { SubTabs } from "../../../components/sub-tabs/SubTabs"
import { SubTabPanel } from "../../../components/sub-tabs/SubTabPanel"
import { GearSlotTiles } from "../gear-slot-tiles/GearSlotTiles"
import { GearAnalysisPanel } from "../gear-analysis-panel/GearAnalysisPanel"
import { GearDetailsPanel } from "../gear-details-panel/GearDetailsPanel"
import { BowPieceDetails } from "../gear-details-panel/BowPieceDetails"
import { GearSetDialog, type GearSetDialogTarget } from "../gear-set-dialog/GearSetDialog"
import { GearSetStrip } from "../gear-set-strip/GearSetStrip"
import { GearInventoryPanel } from "../gear-inventory-panel/GearInventoryPanel"
import type { InventoryRow } from "../gear-inventory-panel/inventoryRows"
import { GearSwapPreviewPanel } from "../gear-swap-preview-panel/GearSwapPreviewPanel"
import { NewGearPieceDialog } from "../new-gear-piece-dialog/NewGearPieceDialog"
import { ImportGearDialog } from "../import-gear-dialog/ImportGearDialog"
import { EquippedBuildDialog } from "../equipped-build-dialog/EquippedBuildDialog"
import { equippedFromImported } from "../import-gear-dialog/importedGearPieces"
import { RetunementAnalyzerPanel } from "../retunement-analyzer-panel/RetunementAnalyzerPanel"
import { ReattunementAnalyzerPanel } from "../reattunement-analyzer-panel/ReattunementAnalyzerPanel"
import { useSelectedPieceDelta } from "../../../hooks/useSelectedPieceDelta"
import { useEquippedDpsDeltas } from "../../../hooks/useEquippedDpsDeltas"
import { useRetunementAnalysis } from "../../../hooks/useRetunementAnalysis"
import { useReattunementAnalysis } from "../../../hooks/useReattunementAnalysis"
import { useWordMaxAnalysis } from "../../../hooks/useWordMaxAnalysis"
import type { CustomGraduationBuild } from "../../../../engine/customGraduationBuild"
import type { HeirloomProfile } from "../../../../engine/heirloom"
import styles from "./GearTab.module.scss"

interface Props {
  inputs: Inputs
  configuredInputs: Inputs
  engineInputs: Inputs
  customGraduationBuild: CustomGraduationBuild | null
  onChange(next: Inputs): void
  currentDps: number
}

export function GearTab({
  inputs,
  configuredInputs,
  engineInputs,
  customGraduationBuild,
  onChange,
  currentDps,
}: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<GearSlot | null>(null)
  const [selectedBowSlot, setSelectedBowSlot] = useState<BowSlot | null>(null)
  const [setDialogOpen, setSetDialogOpen] = useState(false)
  const [newPieceOpen, setNewPieceOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [sub, setSub] = useState<"analysis" | "inventory">("analysis")

  const inventory = inputs.inventory
  const equipped = inputs.equipped
  const heirloomProfile: HeirloomProfile = {
    classId: inputs.classId,
    graduationBuildId: inputs.graduationBuildId,
    customGraduationBuild,
  }

  const visibleRows: InventoryRow[] = inventory.map((piece) => ({
    piece,
    isEquipped: equipped[piece.slot] === piece.id,
  }))

  const selectedPiece = selectedPieceId
    ? (inventory.find((piece) => piece.id === selectedPieceId) ?? null)
    : null
  const liveSelectedPieceId = selectedPiece ? selectedPieceId : null

  const isEquipped = !!selectedPiece && equipped[selectedPiece.slot] === selectedPiece.id

  const equippedDeltas = useEquippedDpsDeltas(engineInputs, currentDps)
  const previewPieceId = selectedPiece && !isEquipped ? selectedPiece.id : null
  const previewDelta = useSelectedPieceDelta(engineInputs, currentDps, previewPieceId)
  const previewMatches = previewDelta.forPieceId === previewPieceId
  const selectedDelta = !selectedPiece
    ? undefined
    : isEquipped
      ? equippedDeltas.deltas[selectedPiece.id]
      : previewMatches
        ? previewDelta.delta
        : undefined
  const selectedDeltaPending = isEquipped
    ? equippedDeltas.isPending
    : previewDelta.isPending || !previewMatches

  const retuneTargetId = selectedPiece?.id ?? null
  const retunement = useRetunementAnalysis(engineInputs, retuneTargetId)
  const retuneRowsMatch = retunement.forPieceId === retuneTargetId
  const reattunement = useReattunementAnalysis(engineInputs, retuneTargetId)
  const reattuneOptsMatch = reattunement.forPieceId === retuneTargetId
  const wordMax = useWordMaxAnalysis(engineInputs, selectedPiece)
  const wordMaxRowsMatch = wordMax.forPieceId === (selectedPiece?.id ?? null)

  function commitGearChange(nextInventory: GearPiece[], nextEquipped: EquippedSlots): void {
    onChange({ ...inputs, inventory: nextInventory, equipped: nextEquipped })
  }

  function updatePiece(updated: GearPiece): void {
    const nextInventory = inventory.map((piece) => (piece.id === updated.id ? updated : piece))
    let nextEquipped = equipped
    const previous = inventory.find((piece) => piece.id === updated.id)
    if (previous && previous.slot !== updated.slot) {
      if (equipped[previous.slot] === updated.id) {
        nextEquipped = { ...equipped, [previous.slot]: null }
      }
    }
    commitGearChange(nextInventory, nextEquipped)
  }

  const selectedBowPiece = selectedBowSlot ? inputs.bowGear[selectedBowSlot] : null

  function updateBowPiece(slot: BowSlot, bowPiece: BowPiece | null): void {
    onChange({ ...inputs, bowGear: { ...inputs.bowGear, [slot]: bowPiece } })
  }

  function addBowPiece(slot: BowSlot): void {
    const gearLevel = gearLevelForBreakthrough(inputs.breakthrough)
    updateBowPiece(slot, {
      level: Math.max(gearLevel, 91) as BowGearLevel,
      rarity: "legendary",
      set: null,
    })
  }

  async function deleteBowPiece(slot: BowSlot): Promise<void> {
    if (!(await confirm(t("gear.deleteThisGearPiece")))) return
    updateBowPiece(slot, null)
  }

  let setDialogTarget: GearSetDialogTarget | null = null
  if (selectedBowSlot && selectedBowPiece) {
    setDialogTarget = { kind: "bow", slot: selectedBowSlot, piece: selectedBowPiece }
  } else if (selectedPiece && isWeaponSlot(selectedPiece.slot)) {
    setDialogTarget = { kind: "piece", piece: selectedPiece, isEquipped }
  }

  function applySetChoice(setId: string | null, applyToGroup: boolean): void {
    setSetDialogOpen(false)
    if (selectedBowSlot) {
      onChange(withSetChoice(inputs, { kind: "bow", slot: selectedBowSlot }, false, setId))
    } else if (selectedPiece) {
      onChange(
        withSetChoice(inputs, { kind: "piece", pieceId: selectedPiece.id }, applyToGroup, setId),
      )
    }
  }

  function openCreateDialog(): void {
    setNewPieceOpen(true)
  }

  function handleCreateSave(piece: GearPiece, mode: "store" | "equip"): void {
    setNewPieceOpen(false)
    setSelectedBowSlot(null)
    setSelectedSlot(piece.slot)
    if (mode === "equip") {
      commitGearChange([...inventory, piece], { ...equipped, [piece.slot]: piece.id })
      setSelectedPieceId(piece.id)
      return
    }
    onChange({ ...inputs, inventory: [...inventory, { ...piece, isNew: true }] })
  }

  async function deletePiece(): Promise<void> {
    if (!selectedPiece) return
    if (!(await confirm(t("gear.deleteThisGearPiece")))) return
    const nextInventory = inventory.filter((piece) => piece.id !== selectedPiece.id)
    const nextEquipped: Record<GearSlot, string | null> = { ...equipped }
    for (const slot of GEAR_SLOTS) {
      if (nextEquipped[slot] === selectedPiece.id) nextEquipped[slot] = null
    }
    commitGearChange(nextInventory, nextEquipped)
    setSelectedPieceId(null)
  }

  function equipSelected(): void {
    if (!selectedPiece) return
    commitGearChange(inventory, { ...equipped, [selectedPiece.slot]: selectedPiece.id })
  }

  function unequipSelected(): void {
    if (!selectedPiece) return
    commitGearChange(inventory, { ...equipped, [selectedPiece.slot]: null })
  }

  function selectInventoryRow(row: InventoryRow): void {
    setSelectedBowSlot(null)
    setSelectedPieceId(row.piece.id)
    setSelectedSlot(row.piece.slot)
    if (row.piece.isNew) {
      onChange({
        ...inputs,
        inventory: inventory.map((piece) =>
          piece.id === row.piece.id ? (({ isNew: _drop, ...rest }) => rest)(piece) : piece,
        ),
      })
    }
  }

  async function importGear(
    imported: GearPiece[],
    mindMethods: Inputs["mindMethods"] | null,
    keepDisplaced: boolean,
    importedBowGear: BowGear,
  ): Promise<void> {
    const displaced = GEAR_SLOTS.map((slot) => equipped[slot]).filter(
      (pieceId): pieceId is string => !!pieceId,
    )
    const filledSlots = new Set(imported.map((piece) => piece.slot))
    const emptiedCount =
      GEAR_SLOTS.filter((slot) => equipped[slot] && !filledSlots.has(slot)).length +
      BOW_SLOTS.filter((slot) => inputs.bowGear[slot] && !importedBowGear[slot]).length
    if (
      emptiedCount > 0 &&
      !(await confirm(
        `${t("gear.thisImportHasNothingFor")} ${emptiedCount} ${t("gear.ofYourEquippedSlotsEmpty")}`,
      ))
    ) {
      return
    }

    const kept = keepDisplaced
      ? inventory
      : inventory.filter((piece) => !displaced.includes(piece.id))
    const nextEquipped = equippedFromImported(imported)

    setImportOpen(false)
    const next: Inputs = {
      ...inputs,
      inventory: [...kept, ...imported],
      equipped: nextEquipped,
      bowGear: importedBowGear,
    }
    onChange(mindMethods ? { ...next, mindMethods } : next)
    const first = imported[0]
    if (first) {
      setSelectedBowSlot(null)
      setSelectedSlot(first.slot)
      setSelectedPieceId(first.id)
    }
  }

  function selectSlot(slot: GearSlot, pieceId: string | null): void {
    setSelectedBowSlot(null)
    setSelectedSlot(slot)
    setSelectedPieceId(pieceId)
  }

  function selectBowSlot(slot: BowSlot): void {
    setSelectedSlot(null)
    setSelectedPieceId(null)
    setSelectedBowSlot(slot)
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2>{t("gear.equipped")}</h2>
          <button type="button" className="btn primary" onClick={() => setImportOpen(true)}>
            {t("gear.importGear")}
          </button>
          <div className="spacer" />
          <button
            type="button"
            className={`btn secondary ${styles.summaryButton}`}
            onClick={() => setSummaryOpen(true)}
          >
            {t("gear.buildSummary")}
          </button>
          <button type="button" className="btn primary" onClick={openCreateDialog}>
            + {t("gear.createGear")}
          </button>
        </div>
        <GearSlotTiles
          inputs={inputs}
          inventory={inventory}
          profile={heirloomProfile}
          equipped={equipped}
          selectedPieceId={liveSelectedPieceId}
          selectedSlot={selectedSlot}
          selectedBowSlot={selectedBowSlot}
          onSelectSlot={selectSlot}
          onSelectBowSlot={selectBowSlot}
          dpsDeltas={equippedDeltas.deltas}
          dpsDeltasPending={equippedDeltas.isPending}
        />
        <GearSetStrip inputs={inputs} />
      </div>

      <div className={styles.gearSplit}>
        <div className={styles.gearColumn}>
          {selectedBowSlot ? (
            <BowPieceDetails
              slot={selectedBowSlot}
              piece={selectedBowPiece}
              inputs={inputs}
              onChange={(bowPiece) => updateBowPiece(selectedBowSlot, bowPiece)}
              onAdd={() => addBowPiece(selectedBowSlot)}
              onDelete={() => deleteBowPiece(selectedBowSlot)}
              onBrowseSets={() => setSetDialogOpen(true)}
            />
          ) : (
            <GearDetailsPanel
              piece={selectedPiece}
              isEquipped={isEquipped}
              inputs={inputs}
              profile={heirloomProfile}
              onChange={updatePiece}
              onEquip={equipSelected}
              onUnequip={unequipSelected}
              onDelete={deletePiece}
              onBrowseSets={() => setSetDialogOpen(true)}
              wordMaxRows={wordMaxRowsMatch ? wordMax.rows : []}
              wordMaxPending={wordMax.isPending || !wordMaxRowsMatch}
            />
          )}
          <RetunementAnalyzerPanel
            piece={retuneTargetId ? selectedPiece : null}
            profile={heirloomProfile}
            rows={retuneRowsMatch ? retunement.rows : []}
            reason={!retuneTargetId ? "no-selection" : retuneRowsMatch ? retunement.reason : "ok"}
            isPending={retunement.isPending || !retuneRowsMatch}
          />
          <ReattunementAnalyzerPanel
            piece={retuneTargetId ? selectedPiece : null}
            options={reattuneOptsMatch ? reattunement.options : []}
            probImproveOverall={reattuneOptsMatch ? reattunement.probImproveOverall : 0}
            eDeltaDpsOverall={reattuneOptsMatch ? reattunement.eDeltaDpsOverall : null}
            pityThreshold={reattuneOptsMatch ? reattunement.pityThreshold : null}
            reason={
              !retuneTargetId ? "no-selection" : reattuneOptsMatch ? reattunement.reason : "ok"
            }
            isPending={reattunement.isPending || !reattuneOptsMatch}
          />
        </div>

        <div className={styles.gearColumn}>
          <div>
            <SubTabs
              active={sub}
              onSelect={setSub}
              tabs={[
                { key: "analysis", label: t("gear.analysis") },
                { key: "inventory", label: t("common.inventory") },
              ]}
            />
            <SubTabPanel>
              {sub === "analysis" && (
                <GearAnalysisPanel engineInputs={engineInputs} currentDps={currentDps} />
              )}
              {sub === "inventory" && (
                <GearInventoryPanel
                  rows={visibleRows}
                  profile={heirloomProfile}
                  selectedPieceId={liveSelectedPieceId}
                  onSelect={selectInventoryRow}
                  slotFilter={selectedSlot}
                  onClearSlotFilter={() => setSelectedSlot(null)}
                  engineInputs={engineInputs}
                  currentDps={currentDps}
                />
              )}
            </SubTabPanel>
          </div>

          <GearSwapPreviewPanel
            inputs={engineInputs}
            candidate={selectedPiece}
            isEquipped={isEquipped}
            currentDps={currentDps}
            dpsDelta={selectedDelta}
            dpsDeltasPending={selectedDeltaPending}
          />
        </div>
      </div>

      {setDialogOpen && setDialogTarget && (
        <GearSetDialog
          inputs={configuredInputs}
          target={setDialogTarget}
          onApply={applySetChoice}
          onClose={() => setSetDialogOpen(false)}
        />
      )}

      {newPieceOpen && (
        <NewGearPieceDialog
          initialSlot={selectedSlot ?? "leftWeapon"}
          inputs={inputs}
          profile={heirloomProfile}
          onCancel={() => setNewPieceOpen(false)}
          onSave={handleCreateSave}
        />
      )}

      {importOpen && (
        <ImportGearDialog
          inputs={inputs}
          onCancel={() => setImportOpen(false)}
          onImport={importGear}
        />
      )}

      {summaryOpen && (
        <EquippedBuildDialog
          inputs={inputs}
          profile={heirloomProfile}
          currentDps={currentDps}
          onClose={() => setSummaryOpen(false)}
        />
      )}
    </>
  )
}
