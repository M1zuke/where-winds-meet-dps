import { Fragment, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useAnchoredDropdown } from "../../hooks/useAnchoredDropdown"
import styles from "./Select.module.scss"

export interface SelectOption<Value extends string> {
  value: Value
  label: string
  meta?: string
  group?: string
  disabled?: boolean
}

interface Props<Value extends string> {
  value: Value
  options: readonly SelectOption<Value>[]
  onChange: (next: Value) => void
  ariaLabel: string
  placeholder?: string
  disabled?: boolean
  compact?: boolean
  className?: string
}

function nextEnabledIndex<Value extends string>(
  options: readonly SelectOption<Value>[],
  from: number,
  step: number,
): number {
  for (let index = from + step; index >= 0 && index < options.length; index += step) {
    if (!options[index].disabled) return index
  }
  return from
}

function firstEnabledIndex<Value extends string>(
  options: readonly SelectOption<Value>[],
  step: number,
): number {
  return nextEnabledIndex(options, step > 0 ? -1 : options.length, step)
}

export function Select<Value extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  disabled,
  compact,
  className,
}: Props<Value>) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const position = useAnchoredDropdown(open, triggerRef)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex === -1 ? undefined : options[selectedIndex]
  const isEmpty = !value || !selected

  useEffect(() => {
    if (!open) return
    function dismiss(event: MouseEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", dismiss)
    return () => document.removeEventListener("mousedown", dismiss)
  }, [open])

  function openList() {
    setHighlight(selectedIndex === -1 ? firstEnabledIndex(options, 1) : selectedIndex)
    setOpen(true)
  }

  function commit(index: number) {
    const option = options[index]
    if (!option || option.disabled) return
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      if (!open) return
      event.preventDefault()
      setOpen(false)
      return
    }
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter") {
        event.preventDefault()
        openList()
      }
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setHighlight(nextEnabledIndex(options, highlight, 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlight(nextEnabledIndex(options, highlight, -1))
    } else if (event.key === "Home") {
      event.preventDefault()
      setHighlight(firstEnabledIndex(options, 1))
    } else if (event.key === "End") {
      event.preventDefault()
      setHighlight(firstEnabledIndex(options, -1))
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      commit(highlight)
    } else if (event.key === "Tab") {
      setOpen(false)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={
          styles.trigger +
          (compact ? ` ${styles.compact}` : "") +
          (isEmpty ? ` ${styles.unset}` : "") +
          (className ? ` ${className}` : "")
        }
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        title={selected?.label}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={styles.value + (isEmpty ? ` ${styles.placeholder}` : "")}>
          {selected?.label ?? placeholder ?? ""}
        </span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>
      {open &&
        position &&
        createPortal(
          <ul
            ref={listRef}
            className={styles.list}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              left: position.left,
              minWidth: position.width,
              top: position.top,
              bottom: position.bottom,
              maxHeight: position.maxHeight,
            }}
          >
            {options.map((option, index) => (
              <Fragment key={option.value}>
                {option.group && option.group !== options[index - 1]?.group && (
                  <li role="presentation" className={styles.group}>
                    {option.group}
                  </li>
                )}
                <li
                  role="option"
                  data-value={option.value}
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  className={
                    styles.option +
                    (index === highlight ? ` ${styles.highlighted}` : "") +
                    (option.value === value ? ` ${styles.selected}` : "") +
                    (option.disabled ? ` ${styles.disabled}` : "")
                  }
                  onMouseDown={(event) => {
                    event.preventDefault()
                    commit(index)
                  }}
                  onMouseEnter={() => !option.disabled && setHighlight(index)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.meta && <span className={styles.optionMeta}>{option.meta}</span>}
                </li>
              </Fragment>
            ))}
          </ul>,
          document.body,
        )}
    </>
  )
}
