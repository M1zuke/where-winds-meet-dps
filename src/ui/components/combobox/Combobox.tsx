import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useAnchoredDropdown } from "../../hooks/useAnchoredDropdown"
import styles from "./Combobox.module.scss"

export interface ComboboxOption {
  value: string
  label: string
}

interface Props {
  value: string
  options: ComboboxOption[]
  onChange(value: string): void
  placeholder?: string
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

export function Combobox({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const pos = useAnchoredDropdown(open, wrapperRef)

  const selected = options.find((opt) => opt.value === value)
  const displayText = open ? query : (selected?.label ?? "")

  const filtered = useMemo(() => {
    if (!open) return options
    const queryLower = query.trim().toLowerCase()
    if (!queryLower) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(queryLower))
  }, [open, query, options])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (wrapperRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [open])

  const maxFilteredIndex = Math.max(0, filtered.length - 1)
  const clampedHighlight = Math.min(highlight, maxFilteredIndex)

  function commit(opt: ComboboxOption) {
    onChange(opt.value)
    setOpen(false)
    setQuery("")
    inputRef.current?.blur()
  }

  function openWithReset() {
    setOpen(true)
    setQuery("")
    const idx = options.findIndex((opt) => opt.value === value)
    setHighlight(idx >= 0 ? idx : 0)
  }

  return (
    <div ref={wrapperRef} className={styles.combobox + (className ? ` ${className}` : "")}>
      <input
        ref={inputRef}
        type="text"
        className={styles.comboboxInput}
        value={displayText}
        title={displayText}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-autocomplete="list"
        onFocus={openWithReset}
        onChange={(e) => {
          setQuery(e.target.value)
          setHighlight(0)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === "ArrowDown") {
            e.preventDefault()
            if (!open) {
              openWithReset()
              return
            }
            setHighlight(Math.min(clampedHighlight + 1, maxFilteredIndex))
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setHighlight(Math.max(clampedHighlight - 1, 0))
          } else if (e.key === "Enter") {
            if (open && filtered[clampedHighlight]) {
              e.preventDefault()
              commit(filtered[clampedHighlight])
            }
          } else if (e.key === "Escape") {
            if (open) {
              e.preventDefault()
              setOpen(false)
              setQuery("")
            }
          } else if (e.key === "Tab") {
            setOpen(false)
            setQuery("")
          }
        }}
      />
      {open &&
        pos &&
        createPortal(
          <ul
            ref={dropdownRef}
            className={styles.comboboxDropdown}
            role="listbox"
            style={{
              left: pos.left,
              width: pos.width,
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxHeight,
            }}
          >
            {filtered.length === 0 ? (
              <li className={styles.comboboxEmpty}>—</li>
            ) : (
              filtered.map((opt, index) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  title={opt.label}
                  className={
                    styles.comboboxOption +
                    (index === clampedHighlight ? ` ${styles.isHighlight}` : "") +
                    (opt.value === value ? ` ${styles.isSelected}` : "")
                  }
                  onMouseDown={(e) => {
                    e.preventDefault()
                    commit(opt)
                  }}
                  onMouseEnter={() => setHighlight(index)}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>,
          document.body,
        )}
    </div>
  )
}
