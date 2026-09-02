import { useEffect, useState } from "react"

const TICK_MS = 100

export interface FocusedHold {
  remainingSeconds: number
  isPaused: boolean
}

export function useFocusedHold(holdMs: number): FocusedHold {
  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.ceil(holdMs / 1000))
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    let remainingMs = holdMs
    let lastObserved = Date.now()
    const ticker = setInterval(() => {
      const now = Date.now()
      const sinceLastTick = now - lastObserved
      lastObserved = now
      const isWatching = document.visibilityState === "visible" && document.hasFocus()
      setIsPaused(!isWatching)
      if (!isWatching) return
      remainingMs = Math.max(0, remainingMs - sinceLastTick)
      setRemainingSeconds(Math.ceil(remainingMs / 1000))
      if (remainingMs === 0) clearInterval(ticker)
    }, TICK_MS)
    return () => clearInterval(ticker)
  }, [holdMs])

  return { remainingSeconds, isPaused }
}
