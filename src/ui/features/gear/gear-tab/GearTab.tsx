import { useState } from "react"
import type {
  EquippedSlots,
  GearPiece,
  GearSlot,
  Inputs,
  StoredProfile,
} from "../../../../engine/types"
import { EMPTY_EQUIPPED, GEAR_SLOTS } from "../../../../engine/types"
import { newGearPieceId } from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { GearSlotTiles } from "../gear-slot-tiles/GearSlotTiles"
import { GearDetailsPanel } from "../gear-details-panel/GearDetailsPanel"
import { GearInventoryPanel } from "../gear-inventory-panel/GearInventoryPanel"
import type { InventoryRow } from "../gear-inventory-panel/inventoryRows"
import { GearSwapPreviewPanel } from "../gear-swap-preview-panel/GearSwapPreviewPanel"
import { NewGearPieceDialog } from "../new-gear-piece-dialog/NewGearPieceDialog"
import { ImportGearDialog } from "../import-gear-dialog/ImportGearDialog"
import { RetunementAnalyzerPanel } from "../retunement-analyzer-panel/RetunementAnalyzerPanel"
import { ReattunementAnalyzerPanel } from "../reattunement-analyzer-panel/ReattunementAnalyzerPanel"
import type { DpsDeltaMap } from "../../../hooks/useDpsDeltas"
import { useRetunementAnalysis } from "../../../hooks/useRetunementAnalysis"
import { useReattunementAnalysis } from "../../../hooks/useReattunementAnalysis"
import { useWordMaxAnalysis } from "../../../hooks/useWordMaxAnalysis"
import styles from "./GearTab.module.scss"

interface Props {
  inputs: Inputs
  engineInputs: Inputs
  onChange(next: Inputs): void
  profiles: StoredProfile[]
  activeProfileId: string
  currentDps: number
  dpsDeltas: DpsDeltaMap
  dpsDeltasPending: boolean
  hideComparisons?: boolean
}

export function GearTab({
  inputs,
  engineInputs,
  onChange,
  profiles,
  activeProfileId,
  currentDps,
  dpsDeltas,
  dpsDeltasPending,
  hideComparisons = false,
}: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<GearSlot | null>(null)
  const [showGlobal, setShowGlobal] = useState(false)
  const [newPieceOpen, setNewPieceOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const inventory = inputs.inventory
  const equipped = inputs.equipped

  const liveRows: InventoryRow[] = profiles.flatMap((profile) => {
    const inv = profile.id === activeProfileId ? inputs.inventory : profile.inputs.inventory
    const eq = profile.id === activeProfileId ? equipped : profile.inputs.equipped
    return inv.map((piece) => ({
      piece,
      ownerProfileId: profile.id,
      ownerProfileName: profile.name,
      isEquipped: eq[piece.slot] === piece.id,
    }))
  })
  const visibleRows = showGlobal
    ? liveRows
    : liveRows.filter((row) => row.ownerProfileId === activeProfileId)

  const selectedRow = selectedPieceId
    ? (liveRows.find((row) => row.piece.id === selectedPieceId) ?? null)
    : null
  const selectedPiece = selectedRow?.piece ?? null
  const isForeign = selectedRow ? selectedRow.ownerProfileId !== activeProfileId : false
  const liveSelectedPieceId = selectedRow ? selectedPieceId : null

  const isEquipped =
    !!selectedPiece && !isForeign && equipped[selectedPiece.slot] === selectedPiece.id

  const retuneTargetId = selectedPiece && !isForeign ? selectedPiece.id : null
  const retunement = useRetunementAnalysis(engineInputs, retuneTargetId)
  const retuneRowsMatch = retunement.forPieceId === retuneTargetId
  const reattunement = useReattunementAnalysis(engineInputs, retuneTargetId)
  const reattuneOptsMatch = reattunement.forPieceId === retuneTargetId
  const wordMaxPiece = hideComparisons ? null : selectedPiece
  const wordMax = useWordMaxAnalysis(engineInputs, wordMaxPiece)
  const wordMaxRowsMatch = wordMax.forPieceId === (wordMaxPiece?.id ?? null)

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

  function openCreateDialog(): void {
    setNewPieceOpen(true)
  }

  function handleCreateSave(piece: GearPiece, mode: "store" | "equip"): void {
    setNewPieceOpen(false)
    setSelectedSlot(piece.slot)
    if (mode === "equip") {
      commitGearChange([...inventory, piece], { ...equipped, [piece.slot]: piece.id })
      setSelectedPieceId(piece.id)
      return
    }
    onChange({ ...inputs, inventory: [...inventory, { ...piece, isNew: true }] })
  }

  async function deletePiece(): Promise<void> {
    if (!selectedPiece || isForeign) return
    if (!(await confirm(t("Delete this gear piece?")))) return
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
    if (isForeign) {
      const copy: GearPiece = { ...selectedPiece, id: newGearPieceId() }
      const nextInventory = [...inventory, copy]
      commitGearChange(nextInventory, { ...equipped, [copy.slot]: copy.id })
      setSelectedPieceId(copy.id)
      return
    }
    commitGearChange(inventory, { ...equipped, [selectedPiece.slot]: selectedPiece.id })
  }

  function unequipSelected(): void {
    if (!selectedPiece || isForeign) return
    commitGearChange(inventory, { ...equipped, [selectedPiece.slot]: null })
  }

  function selectInventoryRow(row: InventoryRow): void {
    setSelectedPieceId(row.piece.id)
    setSelectedSlot(row.piece.slot)
    if (row.ownerProfileId === activeProfileId && row.piece.isNew) {
      onChange({
        ...inputs,
        inventory: inventory.map((piece) =>
          piece.id === row.piece.id ? (({ isNew: _drop, ...rest }) => rest)(piece) : piece,
        ),
      })
    }
  }

  async function importGear(imported: GearPiece[], keepDisplaced: boolean): Promise<void> {
    const displaced = GEAR_SLOTS.map((slot) => equipped[slot]).filter(
      (pieceId): pieceId is string => !!pieceId,
    )
    const filledSlots = new Set(imported.map((piece) => piece.slot))
    const emptiedCount = GEAR_SLOTS.filter(
      (slot) => equipped[slot] && !filledSlots.has(slot),
    ).length
    if (
      emptiedCount > 0 &&
      !(await confirm(
        `${t("This import has nothing for")} ${emptiedCount} ${t("of your equipped slots. Empty them?")}`,
      ))
    ) {
      return
    }

    const kept = keepDisplaced
      ? inventory
      : inventory.filter((piece) => !displaced.includes(piece.id))
    const nextEquipped: EquippedSlots = { ...EMPTY_EQUIPPED }
    for (const piece of imported) nextEquipped[piece.slot] = piece.id

    setImportOpen(false)
    commitGearChange([...kept, ...imported], nextEquipped)
    const first = imported[0]
    if (first) {
      setSelectedSlot(first.slot)
      setSelectedPieceId(first.id)
    }
  }

  function selectSlot(slot: GearSlot, pieceId: string | null): void {
    setSelectedSlot(slot)
    setSelectedPieceId(pieceId)
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2>{t("Equipped")}</h2>
          <button type="button" className="btn primary" onClick={() => setImportOpen(true)}>
            {t("Import gear")}
          </button>
        </div>
        <GearSlotTiles
          inventory={inventory}
          equipped={equipped}
          selectedPieceId={liveSelectedPieceId}
          selectedSlot={selectedSlot}
          onSelectSlot={selectSlot}
          dpsDeltas={dpsDeltas}
          dpsDeltasPending={dpsDeltasPending}
          hideComparisons={hideComparisons}
        />
      </div>

      <div className={styles.gearSplit}>
        <GearDetailsPanel
          piece={selectedPiece}
          readOnly={isForeign}
          isEquipped={isEquipped}
          inputs={inputs}
          onChange={updatePiece}
          onEquip={equipSelected}
          onUnequip={unequipSelected}
          onDelete={deletePiece}
          wordMaxRows={wordMaxRowsMatch ? wordMax.rows : []}
          wordMaxPending={wordMax.isPending || !wordMaxRowsMatch}
        />

        <div className="panel">
          <GearInventoryPanel
            rows={visibleRows}
            activeProfileId={activeProfileId}
            selectedPieceId={liveSelectedPieceId}
            showGlobal={showGlobal}
            onToggleGlobal={() => setShowGlobal((prev) => !prev)}
            onSelect={selectInventoryRow}
            onCreate={openCreateDialog}
            slotFilter={selectedSlot}
            onClearSlotFilter={() => setSelectedSlot(null)}
            dpsDeltas={dpsDeltas}
            dpsDeltasPending={dpsDeltasPending}
            hideComparisons={hideComparisons}
          />
        </div>
      </div>

      {!hideComparisons && (
        <div className={styles.gearSplit}>
          <div className={styles.gearAnalyzerStack}>
            <RetunementAnalyzerPanel
              piece={retuneTargetId ? selectedPiece : null}
              rows={retuneRowsMatch ? retunement.rows : []}
              reason={!retuneTargetId ? "no-selection" : retuneRowsMatch ? retunement.reason : "ok"}
              isPending={retunement.isPending || !retuneRowsMatch}
            />
            <ReattunementAnalyzerPanel
              piece={retuneTargetId ? selectedPiece : null}
              options={reattuneOptsMatch ? reattunement.options : []}
              probImproveOverall={reattuneOptsMatch ? reattunement.probImproveOverall : 0}
              reason={
                !retuneTargetId ? "no-selection" : reattuneOptsMatch ? reattunement.reason : "ok"
              }
              isPending={reattunement.isPending || !reattuneOptsMatch}
            />
          </div>
          <GearSwapPreviewPanel
            inputs={engineInputs}
            candidate={selectedPiece}
            isEquipped={isEquipped}
            currentDps={currentDps}
            dpsDelta={selectedPiece ? dpsDeltas[selectedPiece.id] : undefined}
            dpsDeltasPending={dpsDeltasPending}
          />
        </div>
      )}

      {newPieceOpen && (
        <NewGearPieceDialog
          initialSlot={selectedSlot ?? "leftWeapon"}
          inputs={inputs}
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
    </>
  )
}
