import { useId } from "react"
import { useI18n } from "../../../i18n/i18nContext"
import { innerWayKey } from "../../../i18n/contentKeys"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../components/dialog/Dialog"
import { GITHUB_REPO_URL } from "../github-link/GithubLink"
import exampleImageUrl from "./innerWayExample.png"
import type { BreakthroughDataRequest } from "./breakthroughDataRequest"
import { useFocusedHold } from "./useFocusedHold"
import styles from "./BreakthroughDataDialog.module.scss"

const HOLD_MS = 15_000

const ISSUES_URL = `${GITHUB_REPO_URL}/issues/new`

interface BreakthroughDataDialogProps {
  request: BreakthroughDataRequest
  onClose: () => void
}

export function BreakthroughDataDialog({ request, onClose }: BreakthroughDataDialogProps) {
  const { t } = useI18n()
  const titleId = useId()
  const bodyId = useId()
  const { remainingSeconds, isPaused } = useFocusedHold(HOLD_MS)
  const canClose = remainingSeconds === 0

  return (
    <Dialog
      labelledBy={titleId}
      describedBy={bodyId}
      onClose={canClose ? onClose : undefined}
      surfaceClassName={styles.surface}
    >
      <DialogHeader>
        <h2 id={titleId}>{t("layout.breakthroughDataDialog.newBreakthroughDataNeeded")}</h2>
      </DialogHeader>
      <DialogBody className={styles.body}>
        <div className={styles.columns}>
          <div className={styles.main}>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt>{t("layout.breakthroughDataDialog.liveBreakthrough")}</dt>
                <dd className={styles.live}>{request.liveBreakthrough}</dd>
              </div>
              <div className={styles.fact}>
                <dt>{t("layout.breakthroughDataDialog.yourClass")}</dt>
                <dd>{request.className}</dd>
              </div>
            </dl>
            <div id={bodyId}>
              <p>{t("layout.breakthroughDataDialog.aNewBreakthroughIsLive")}</p>
              <p className={styles.emphasis}>
                {t("layout.breakthroughDataDialog.aboveAllTheBasedOn")}
              </p>
            </div>
            <p className={styles.listTitle}>
              {t("layout.breakthroughDataDialog.innerWaysStillNeeded")}
            </p>
            <ul className={styles.innerWays}>
              {request.pendingInnerWays.map((innerWay) => (
                <li key={innerWay.id} className={styles.innerWay}>
                  <span>{t(innerWayKey(innerWay.id), innerWay.name)}</span>
                  <span className={styles.stale}>{innerWay.confirmedBreakthrough}</span>
                </li>
              ))}
            </ul>
            <p>
              <a
                className={styles.link}
                href={ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("layout.breakthroughDataDialog.openAnIssueOnGithub")}
              </a>
            </p>
          </div>
          <figure className={styles.example}>
            <img
              src={exampleImageUrl}
              alt={t("layout.breakthroughDataDialog.exampleInnerWayPanel")}
            />
            <figcaption>{t("layout.breakthroughDataDialog.screenshotTheWholePanel")}</figcaption>
          </figure>
        </div>
      </DialogBody>
      <DialogFooter>
        {!canClose && (
          <span className={styles.hold} role="timer">
            {isPaused
              ? t("layout.breakthroughDataDialog.pausedFocusThisTab")
              : `${remainingSeconds}s`}
          </span>
        )}
        <button type="button" className="btn primary" onClick={onClose} disabled={!canClose}>
          {t("common.close")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
