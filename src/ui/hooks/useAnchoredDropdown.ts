import { useCallback, useLayoutEffect, useState, type RefObject } from "react"

const DROPDOWN_MAX_HEIGHT = 240
const VIEWPORT_MARGIN = 8

export interface DropdownPosition {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
}

function measure(anchor: HTMLElement): DropdownPosition {
  const rect = anchor.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN
  const spaceAbove = rect.top - VIEWPORT_MARGIN
  const openUp = spaceBelow < Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove) && spaceAbove > spaceBelow
  return {
    left: rect.left,
    width: rect.width,
    top: openUp ? undefined : rect.bottom + 2,
    bottom: openUp ? window.innerHeight - rect.top + 2 : undefined,
    maxHeight: Math.max(80, Math.min(DROPDOWN_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow)),
  }
}

export function useAnchoredDropdown(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
): DropdownPosition | null {
  const [position, setPosition] = useState<DropdownPosition | null>(null)

  const reposition = useCallback(() => {
    if (anchorRef.current) setPosition(measure(anchorRef.current))
  }, [anchorRef])

  useLayoutEffect(() => {
    if (!open) return
    reposition()
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
    }
  }, [open, reposition])

  return open ? position : null
}
