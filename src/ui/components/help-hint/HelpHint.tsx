import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import styles from "./HelpHint.module.scss"

const VIEWPORT_MARGIN = 8
const ANCHOR_GAP = 6

interface BubblePosition {
  left: number
  top: number
}

function place(anchor: HTMLElement, bubble: HTMLElement): BubblePosition {
  const anchorRect = anchor.getBoundingClientRect()
  const bubbleRect = bubble.getBoundingClientRect()
  const below = anchorRect.bottom + ANCHOR_GAP
  const fitsBelow = below + bubbleRect.height <= window.innerHeight - VIEWPORT_MARGIN
  const above = anchorRect.top - ANCHOR_GAP - bubbleRect.height
  const centred = anchorRect.left + anchorRect.width / 2 - bubbleRect.width / 2
  return {
    top: fitsBelow ? below : Math.max(VIEWPORT_MARGIN, above),
    left: Math.min(
      Math.max(VIEWPORT_MARGIN, centred),
      window.innerWidth - bubbleRect.width - VIEWPORT_MARGIN,
    ),
  }
}

export function HelpHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<BubblePosition | null>(null)
  const markerRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)

  const reposition = useCallback(() => {
    if (markerRef.current && bubbleRef.current)
      setPosition(place(markerRef.current, bubbleRef.current))
  }, [])

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

  return (
    <>
      <span
        ref={markerRef}
        className={styles.marker}
        aria-label={text}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => {
          setOpen(false)
          setPosition(null)
        }}
      >
        ?
      </span>
      {open &&
        createPortal(
          <span
            ref={bubbleRef}
            role="tooltip"
            className={styles.bubble}
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              visibility: position ? "visible" : "hidden",
            }}
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  )
}
