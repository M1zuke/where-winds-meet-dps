import { useEffect, useRef, useState } from "react"
import type { GearLevel, GearPiece, GearRarity, GearSlot, Inputs } from "../../../../engine/types"
import { emptyGearWords } from "../../../../engine/types"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import { newGearPieceId } from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { GearPieceForm } from "../gear-piece-form/GearPieceForm"
import dialogChrome from "../shared/gearDialog.module.scss"

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
  const [draft, setDraft] = useState<GearPiece>(() => makeDraft(initialSlot))
  const equipButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (e.defaultPrevented) return
      onCancel()
    }
    document.addEventListener("keydown", onKey)
    equipButtonRef.current?.focus()
    return () => document.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={dialogChrome.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gear-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className={dialogChrome.modal}>
        <div className={dialogChrome.header}>
          <h2 id="gear-dialog-title">{t("New gear piece")}</h2>
        </div>
        <div className={dialogChrome.body}>
          <GearPieceForm
            piece={draft}
            inputs={inputs}
            disabled={false}
            onChange={setDraft}
            wordMaxRows={[]}
            wordMaxPending={false}
            showWordMax={false}
          />
        </div>
        <div className={dialogChrome.footer}>
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
        </div>
      </div>
    </div>
  )
}
