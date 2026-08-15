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
          {t("Drag this to your bookmarks bar:")}{" "}
          <a
            ref={attachBookmarklet}
            className={styles.bookmarklet}
            onClick={(event) => event.preventDefault()}
          >
            {t("Import WWM Gear")}
          </a>
        </li>
        <li>
          {t("Open the")}{" "}
          <a href={DASHBOARD_URL} target="_blank" rel="noreferrer">
            {t("official WWM dashboard")}
          </a>{" "}
          {t("and sign in, then click the bookmark.")}
        </li>
        <li>{t("Paste what it copied below.")}</li>
      </ol>

      {notice && <div className="hint">{notice}</div>}

      <textarea
        className={styles.paste}
        value={pasted}
        spellCheck={false}
        placeholder={t("Paste the copied gear JSON here")}
        onChange={(event) => onPasteChange(event.target.value)}
      />

      {parseError && <div className="warnings">⚠ {parseError}</div>}
    </>
  )
}
