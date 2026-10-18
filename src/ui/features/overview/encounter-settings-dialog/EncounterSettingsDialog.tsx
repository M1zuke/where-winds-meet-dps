import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react"
import {
  activeEncounterOptionCount,
  ENCOUNTER_CATEGORIES,
  encounterFieldsEqual,
  withEncounterFieldsOf,
  type EncounterCategory,
} from "../../../../engine/encounterOptions"
import type { Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import { EncounterOptionCard } from "../encounter-option-card/EncounterOptionCard"
import { EncounterCategoryPanel } from "../encounter-category-panel/EncounterCategoryPanel"
import { EncounterIcon } from "../encounter-icon/EncounterIcon"
import { CATEGORY_ICONS, CATEGORY_LABEL_KEYS } from "./encounterOptionText"
import styles from "./EncounterSettingsDialog.module.scss"

interface Props {
  inputs: Inputs
  engineInputs: Inputs
  category: EncounterCategory
  onCategoryChange: (category: EncounterCategory) => void
  onChange: (next: Inputs) => void
  onClose: () => void
}

export function EncounterSettingsDialog({
  inputs,
  engineInputs,
  category,
  onCategoryChange,
  onChange,
  onClose,
}: Props) {
  const { t } = useI18n()
  const idBase = useId()
  const titleId = `${idBase}-title`
  const panelId = `${idBase}-panel`
  const tabId = (tabCategory: EncounterCategory) => `${idBase}-tab-${tabCategory}`
  const selectedTabRef = useRef<HTMLButtonElement>(null)
  const tabRefs = useRef<Partial<Record<EncounterCategory, HTMLButtonElement | null>>>({})
  const [draft, setDraft] = useState(inputs)
  const draftEngineInputs = useMemo(
    () => withEncounterFieldsOf(engineInputs, draft),
    [engineInputs, draft],
  )
  const totalActive = activeEncounterOptionCount(draft)

  function applyDraft(): void {
    if (!encounterFieldsEqual(inputs, draft)) onChange(withEncounterFieldsOf(inputs, draft))
    onClose()
  }

  function moveSelection(event: KeyboardEvent<HTMLDivElement>): void {
    const current = ENCOUNTER_CATEGORIES.indexOf(category)
    const last = ENCOUNTER_CATEGORIES.length - 1
    let target: number
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      target = current === last ? 0 : current + 1
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      target = current === 0 ? last : current - 1
    } else if (event.key === "Home") {
      target = 0
    } else if (event.key === "End") {
      target = last
    } else {
      return
    }
    event.preventDefault()
    const targetCategory = ENCOUNTER_CATEGORIES[target]
    onCategoryChange(targetCategory)
    tabRefs.current[targetCategory]?.focus()
  }

  return (
    <Dialog
      labelledBy={titleId}
      onClose={onClose}
      surfaceClassName={styles.surface}
      initialFocusRef={selectedTabRef}
    >
      <DialogHeader>
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h2 id={titleId}>{t("overview.encounterSettings")}</h2>
            <p className={styles.subtitle}>{t("overview.encounterSettings.dialogSubtitle")}</p>
          </div>
          <span className={styles.breakthroughChip}>
            {t("overview.encounterSettings.breakthroughChip").replace(
              "{n}",
              String(inputs.breakthrough),
            )}
          </span>
          <button
            type="button"
            className={`btn ${styles.closeButton}`}
            aria-label={t("common.close")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </DialogHeader>

      <div className={styles.dummyRow}>
        <EncounterOptionCard
          kind="toggle"
          label={t("overview.encounterSettings.enableDummy")}
          hint={t("overview.encounterSettings.enableDummyHint")}
          icon="target"
          selected={draft.dummyMode}
          onSelect={() => setDraft({ ...draft, dummyMode: !draft.dummyMode })}
        />
      </div>

      <div className={styles.layout}>
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label={t("overview.encounterSettings")}
          className={styles.nav}
          onKeyDown={moveSelection}
        >
          {ENCOUNTER_CATEGORIES.map((tabCategory) => {
            const isSelected = tabCategory === category
            const count = activeEncounterOptionCount(draft, tabCategory)
            return (
              <button
                key={tabCategory}
                ref={(element) => {
                  tabRefs.current[tabCategory] = element
                  if (isSelected) selectedTabRef.current = element
                }}
                id={tabId(tabCategory)}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={panelId}
                tabIndex={isSelected ? 0 : -1}
                className={styles.tab + (isSelected ? ` ${styles.tabSelected}` : "")}
                onClick={() => onCategoryChange(tabCategory)}
              >
                <EncounterIcon name={CATEGORY_ICONS[tabCategory]} className={styles.tabIcon} />
                <span className={styles.tabLabel}>{t(CATEGORY_LABEL_KEYS[tabCategory])}</span>
                {count > 0 && <span className={styles.badge}>{count}</span>}
              </button>
            )
          })}
        </div>

        <DialogBody className={styles.content}>
          <EncounterCategoryPanel
            id={panelId}
            labelledBy={tabId(category)}
            category={category}
            inputs={draft}
            engineInputs={draftEngineInputs}
            onChange={setDraft}
          />
        </DialogBody>
      </div>

      <DialogFooter>
        <span className={styles.activeCount}>
          {(totalActive === 1
            ? t("overview.encounterSettings.settingsActiveOne")
            : t("overview.encounterSettings.settingsActiveMany")
          ).replace("{n}", String(totalActive))}
        </span>
        <button type="button" className={`btn ${styles.cancel}`} onClick={onClose}>
          {t("common.cancel")}
        </button>
        <button type="button" className={`btn primary ${styles.done}`} onClick={applyDraft}>
          {t("overview.encounterSettings.done")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
