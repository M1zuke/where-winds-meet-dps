import { useId, useRef, useState } from "react"
import type { GearLevel, GearPiece, GearRarity, GearSlot, Inputs } from "../../../../engine/types"
import { emptyGearWords } from "../../../../engine/types"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import { newGearPieceId } from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import { GearPieceForm } from "../gear-piece-form/GearPieceForm"

interface Props {
  initialSlot: GearSlot
  inputs: Inputs
  onCancel(): void
  onSave(piece: GearPiece, mode: "store" | "equip"): void
}

function makeDraft(slot: GearSlot): GearPiece {
  const level: GearLevel = 96
  const rarity: GearRarity = "legendary"
  const base = gearBaseStatsFor({ slot, level, rarity })
  return {
    id: newGearPieceId(),
    slot,
    level,
    rarity,
    minPhys: base.minPhys,
    maxPhys: base.maxPhys,
    hp: base.hp,
    physDef: base.physDef,
    words: emptyGearWords(),
    attunement: "",
    attunementValue: 0,
    relayed: false,
  }
}

export function NewGearPieceDialog({ initialSlot, inputs, onCancel, onSave }: Props) {
  const { t } = useI18n()
  const titleId = useId()
  const [draft, setDraft] = useState<GearPiece>(() => makeDraft(initialSlot))
  const equipButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <Dialog labelledBy={titleId} onClose={onCancel} initialFocusRef={equipButtonRef}>
      <DialogHeader>
        <h2 id={titleId}>{t("New gear piece")}</h2>
      </DialogHeader>
      <DialogBody>
        <GearPieceForm
          piece={draft}
          inputs={inputs}
          disabled={false}
          onChange={setDraft}
          wordMaxRows={[]}
          wordMaxPending={false}
          showWordMax={false}
        />
      </DialogBody>
      <DialogFooter>
        <button type="button" className="btn" onClick={onCancel}>
          {t("Cancel")}
        </button>
        <button type="button" className="btn" onClick={() => onSave(draft, "store")}>
          {t("Save & Store")}
        </button>
        <button
          type="button"
          ref={equipButtonRef}
          className="btn primary"
          onClick={() => onSave(draft, "equip")}
        >
          {t("Save & Equip")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
