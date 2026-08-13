import { useEffect, useId, type ReactNode, type RefObject } from "react"
import styles from "./Dialog.module.scss"

export type DialogLayer = "wizard" | "dialog" | "confirm"

const LAYER_CLASS: Record<DialogLayer, string> = {
  wizard: styles.layerWizard,
  dialog: styles.layerDialog,
  confirm: styles.layerConfirm,
}

const openDialogIds: string[] = []

interface DialogProps {
  labelledBy: string
  describedBy?: string
  onClose?: () => void
  layer?: DialogLayer
  surfaceClassName?: string
  initialFocusRef?: RefObject<HTMLElement | null>
  children: ReactNode
}

export function Dialog({
  labelledBy,
  describedBy,
  onClose,
  layer = "dialog",
  surfaceClassName,
  initialFocusRef,
  children,
}: DialogProps) {
  const dialogId = useId()

  useEffect(() => {
    openDialogIds.push(dialogId)
    return () => {
      const position = openDialogIds.indexOf(dialogId)
      if (position >= 0) openDialogIds.splice(position, 1)
    }
  }, [dialogId])

  useEffect(() => {
    initialFocusRef?.current?.focus()
  }, [initialFocusRef])

  useEffect(() => {
    if (!onClose) return
    const closeOnEscape = onClose
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return
      if (openDialogIds[openDialogIds.length - 1] !== dialogId) return
      event.preventDefault()
      closeOnEscape()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose, dialogId])

  return (
    <div
      className={`${styles.overlay} ${LAYER_CLASS[layer]}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onMouseDown={(event) => {
        if (onClose && event.target === event.currentTarget) onClose()
      }}
    >
      <div className={`${styles.surface} ${surfaceClassName ?? styles.defaultWidth}`}>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className={styles.header}>{children}</div>
}

export function DialogBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className ? `${styles.body} ${className}` : styles.body}>{children}</div>
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>
}
