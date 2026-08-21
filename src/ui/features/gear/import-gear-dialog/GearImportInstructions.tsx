import { useI18n } from "../../../../i18n/i18nContext"
import { bookmarkletHref } from "./bookmarkletHref"
import bookmarkletSource from "./gearImportBookmarklet.js?raw"
import styles from "./gearImport.module.scss"

export const DASHBOARD_URL = "https://www.wherewindsmeetgame.com/m/2025h5sjgj/en/"

interface Props {
  pasted: string
  onPasteChange(value: string): void
  parseError: string
  notice: string
}

export function GearImportInstructions({ pasted, onPasteChange, parseError, notice }: Props) {
  const { t } = useI18n()

  // Set through a ref rather than the href prop so React never inspects the
  // javascript: URL, and on every mount because the anchor unmounts while a
  // parsed capture is on screen.
  function attachBookmarklet(anchor: HTMLAnchorElement | null): void {
    anchor?.setAttribute("href", bookmarkletHref(bookmarkletSource))
  }

  return (
    <>
      <ol className={styles.steps}>
        <li>
          {t("gear.importGearDialog.dragThisToYourBookmarks")}{" "}
          <a
            ref={attachBookmarklet}
            className={styles.bookmarklet}
            onClick={(event) => event.preventDefault()}
          >
            {t("gear.importGearDialog.importWwmGear")}
          </a>
        </li>
        <li>
          {t("gear.importGearDialog.openThe")}{" "}
          <a href={DASHBOARD_URL} target="_blank" rel="noreferrer">
            {t("gear.importGearDialog.officialWwmDashboard")}
          </a>{" "}
          {t("gear.importGearDialog.andSignInThenClick")}
        </li>
        <li>{t("gear.importGearDialog.pasteWhatItCopiedBelow")}</li>
      </ol>

      {notice && <div className="hint">{notice}</div>}

      <textarea
        className={styles.paste}
        value={pasted}
        spellCheck={false}
        placeholder={t("gear.importGearDialog.pasteTheCopiedGearJson")}
        onChange={(event) => onPasteChange(event.target.value)}
      />

      {parseError && <div className="warnings">⚠ {parseError}</div>}
    </>
  )
}
