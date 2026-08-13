import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useI18n } from "../../../i18n/i18nContext"
import { Dialog } from "../dialog/Dialog"
import { ConfirmContext, type ConfirmFn } from "./confirmContext"
import styles from "./ConfirmDialog.module.scss"

interface PendingState {
  message: string
  resolve: (ok: boolean) => void
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const messageId = useId()
  const [pending, setPending] = useState<PendingState | null>(null)
  const okButtonRef = useRef<HTMLButtonElement | null>(null)

  const confirm = useCallback<ConfirmFn>((message) => {
    return new Promise<boolean>((resolve) => {
      setPending({ message, resolve })
    })
  }, [])

  function close(ok: boolean) {
    if (!pending) return
    pending.resolve(ok)
    setPending(null)
  }

  useEffect(() => {
    if (!pending) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.defaultPrevented) return
      e.preventDefault()
      close(true)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <Dialog
          labelledBy={messageId}
          onClose={() => close(false)}
          layer="confirm"
          surfaceClassName={styles.confirmSurface}
          initialFocusRef={okButtonRef}
        >
          <p id={messageId} className={styles.confirmMessage}>
            {pending.message}
          </p>
          <div className={styles.confirmButtons}>
            <button type="button" className="btn" onClick={() => close(false)}>
              {t("Cancel")}
            </button>
            <button
              type="button"
              ref={okButtonRef}
              className="btn primary"
              onClick={() => close(true)}
            >
              {t("Confirm")}
            </button>
          </div>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  )
}
