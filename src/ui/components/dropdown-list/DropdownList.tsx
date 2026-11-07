import { useEffect, useRef, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"
import { useAnchoredDropdown } from "../../hooks/useAnchoredDropdown"
import styles from "./DropdownList.module.scss"

interface DropdownListProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
  ariaLabel?: string
  multiselectable?: boolean
  children: ReactNode
}

export function DropdownList({
  open,
  anchorRef,
  onClose,
  ariaLabel,
  multiselectable,
  children,
}: DropdownListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const position = useAnchoredDropdown(open, anchorRef, listRef)

  useEffect(() => {
    if (!open) return
    function dismissOnOutsideMouseDown(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      onClose()
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      event.preventDefault()
      onClose()
    }
    document.addEventListener("mousedown", dismissOnOutsideMouseDown)
    document.addEventListener("keydown", closeOnEscape, true)
    return () => {
      document.removeEventListener("mousedown", dismissOnOutsideMouseDown)
      document.removeEventListener("keydown", closeOnEscape, true)
    }
  }, [open, anchorRef, onClose])

  if (!open || !position) return null
  return createPortal(
    <ul
      ref={listRef}
      className={styles.list}
      role="listbox"
      aria-label={ariaLabel}
      aria-multiselectable={multiselectable || undefined}
      style={{
        left: position.left,
        minWidth: position.width,
        top: position.top,
        bottom: position.bottom,
        maxHeight: position.maxHeight,
      }}
    >
      {children}
    </ul>,
    document.body,
  )
}

interface DropdownOptionProps {
  value?: string
  label: string
  meta?: string
  title?: string
  selected: boolean
  highlighted: boolean
  disabled?: boolean
  showCheck?: boolean
  onSelect: () => void
  onHover: () => void
}

export function DropdownOption({
  value,
  label,
  meta,
  title,
  selected,
  highlighted,
  disabled,
  showCheck,
  onSelect,
  onHover,
}: DropdownOptionProps) {
  return (
    <li
      role="option"
      data-value={value}
      title={title}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      className={
        styles.option +
        (highlighted ? ` ${styles.highlighted}` : "") +
        (selected ? ` ${styles.selected}` : "") +
        (disabled ? ` ${styles.disabled}` : "")
      }
      onMouseDown={(event) => {
        event.preventDefault()
        onSelect()
      }}
      onMouseEnter={() => !disabled && onHover()}
    >
      {showCheck && (
        <span className={styles.check} aria-hidden="true">
          {selected ? "✓" : ""}
        </span>
      )}
      <span className={styles.optionLabel}>{label}</span>
      {meta && <span className={styles.optionMeta}>{meta}</span>}
    </li>
  )
}

export function DropdownGroupLabel({ label }: { label: string }) {
  return (
    <li role="presentation" className={styles.group}>
      {label}
    </li>
  )
}

export function DropdownEmpty({ text }: { text: string }) {
  return <li className={styles.empty}>{text}</li>
}
