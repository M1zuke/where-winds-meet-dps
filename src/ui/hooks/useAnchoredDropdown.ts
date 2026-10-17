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

function clampLeft(left: number, listWidth: number): number {
  const rightmost = window.innerWidth - listWidth - VIEWPORT_MARGIN
  return Math.max(VIEWPORT_MARGIN, Math.min(left, rightmost))
}

export function useAnchoredDropdown(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  listRef: RefObject<HTMLElement | null>,
): DropdownPosition | null {
  const [position, setPosition] = useState<DropdownPosition | null>(null)
  const [listWidth, setListWidth] = useState(0)

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
      setPosition(null)
      setListWidth(0)
    }
  }, [open, reposition])

  const listMounted = position !== null

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measureWidth = () => setListWidth(list.getBoundingClientRect().width)
    measureWidth()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measureWidth)
    observer.observe(list)
    return () => observer.disconnect()
  }, [listRef, listMounted])

  if (!open || !position) return null
  return { ...position, left: clampLeft(position.left, listWidth) }
}
