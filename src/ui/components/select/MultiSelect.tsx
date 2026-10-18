import { useRef, useState } from "react"
import { DropdownEmpty, DropdownList, DropdownOption } from "../dropdown-list/DropdownList"

export interface MultiSelectOption {
  id: string
  label: string
}

interface Props {
  label: string
  options: readonly MultiSelectOption[]
  selected: readonly string[]
  onChange: (ids: string[]) => void
}

export function MultiSelect({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectedIds = new Set(selected)
  const count = selected.length

  function toggle(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setHighlight(Math.min(highlight + 1, options.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlight(Math.max(highlight - 1, 0))
    } else if ((event.key === "Enter" || event.key === " ") && options[highlight]) {
      event.preventDefault()
      toggle(options[highlight].id)
    } else if (event.key === "Tab") {
      setOpen(false)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        onKeyDown={onKeyDown}
      >
        {label}
        {count > 0 ? ` (${count})` : ""} ▾
      </button>
      <DropdownList
        open={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        ariaLabel={label}
        multiselectable
      >
        {options.length === 0 && <DropdownEmpty text="—" />}
        {options.map((option, index) => (
          <DropdownOption
            key={option.id}
            value={option.id}
            label={option.label}
            selected={selectedIds.has(option.id)}
            highlighted={index === highlight}
            showCheck
            onSelect={() => toggle(option.id)}
            onHover={() => setHighlight(index)}
          />
        ))}
      </DropdownList>
    </>
  )
}
