import { useId, useState } from "react"
import { useI18n } from "../../../i18n/i18nContext"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../components/dialog/Dialog"
import { PingFpsFields } from "../../components/ping-fps-fields/PingFpsFields"
import { hasValidPingAndFps } from "../../../engine/pingFps"

interface Props {
  pingMs: number | null
  averageFps: number | null
  onConfirm: (pingMs: number, averageFps: number) => void
}

export function PingFpsRequiredDialog({ pingMs, averageFps, onConfirm }: Props) {
  const { t } = useI18n()
  const titleId = useId()
  const [draftPingMs, setDraftPingMs] = useState(pingMs)
  const [draftAverageFps, setDraftAverageFps] = useState(averageFps)
  const canConfirm = hasValidPingAndFps(draftPingMs, draftAverageFps)

  return (
    <Dialog labelledBy={titleId}>
      <DialogHeader>
        <h2 id={titleId}>{t("layout.pingFpsRequiredDialog.pingAndAverageFpsNeeded")}</h2>
      </DialogHeader>
      <DialogBody>
        <p>{t("layout.pingFpsRequiredDialog.thisProfileHasNoPingHint")}</p>
        <PingFpsFields
          pingMs={draftPingMs}
          averageFps={draftAverageFps}
          onPingMsChange={setDraftPingMs}
          onAverageFpsChange={setDraftAverageFps}
        />
      </DialogBody>
      <DialogFooter>
        <button
          type="button"
          className="btn primary"
          disabled={!canConfirm}
          onClick={() => {
            if (draftPingMs !== null && draftAverageFps !== null)
              onConfirm(draftPingMs, draftAverageFps)
          }}
        >
          {t("common.continue")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
