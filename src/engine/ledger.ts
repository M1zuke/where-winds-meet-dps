// The timeline's record of which statuses are up, and at how many stacks, at
// any frame. Extracted so a skill can be handed a read-only view of it rather
// than the timeline resolving everything on the skill's behalf.
//
// Windows and stacks are tracked separately on purpose: a stack count is a
// step function over the whole run, while a window says when that count is
// live. `conditionStacksAt` is the pair of them — the question a trigger asks.

export interface StatusWindow {
  start: number
  end: number
  owner?: number
  extensions?: Array<{ frame: number; amount: number }>
}

export const UNOWNED = Number.NEGATIVE_INFINITY

export interface StatusView {
  activeIdsAt(frame: number): string[]
  isActiveAt(id: string, frame: number): boolean
  stacksAt(id: string, frame: number): number
  conditionStacksAt(id: string, frame: number): number
  remainingFramesAt(id: string, frame: number): number | undefined
  windowsOf(id: string): readonly StatusWindow[]
}

// An extension applied after `frame` has not happened yet from that frame's
// point of view, so it is subtracted back out when reading a window's end.
export function windowEndAt(window: StatusWindow, frame: number): number {
  if (!window.extensions) return window.end
  let end = window.end
  for (const extension of window.extensions) if (extension.frame > frame) end -= extension.amount
  return end
}

function cloneWindow(window: StatusWindow): StatusWindow {
  return window.extensions ? { ...window, extensions: [...window.extensions] } : { ...window }
}

export class StatusLedger implements StatusView {
  private readonly windows = new Map<string, StatusWindow[]>()
  private readonly stacks = new Map<
    string,
    Array<{ frame: number; value: number; owner: number }>
  >()
  private readonly permanentOpened = new Set<string>()

  constructor(
    private readonly spanStart: number,
    private readonly spanEnd: number,
  ) {}

  pushWindow(id: string, start: number, end: number, owner: number = UNOWNED): void {
    const window: StatusWindow = { start, end, owner }
    const existing = this.windows.get(id)
    if (existing) existing.push(window)
    else this.windows.set(id, [window])
  }

  openPermanent(id: string): void {
    if (this.permanentOpened.has(id)) return
    this.permanentOpened.add(id)
    this.pushWindow(id, this.spanStart, this.spanEnd)
  }

  recordStack(id: string, frame: number, value: number, owner: number = UNOWNED): void {
    const existing = this.stacks.get(id)
    if (existing) existing.push({ frame, value, owner })
    else this.stacks.set(id, [{ frame, value, owner }])
  }

  throughOwner(ownerLimit: number): StatusLedger {
    const view = new StatusLedger(this.spanStart, this.spanEnd)
    for (const [id, windows] of this.windows) {
      const kept = windows.filter((window) => (window.owner ?? UNOWNED) <= ownerLimit)
      if (kept.length > 0) view.windows.set(id, kept.map(cloneWindow))
    }
    for (const [id, history] of this.stacks) {
      const kept = history.filter((entry) => entry.owner <= ownerLimit)
      if (kept.length > 0) view.stacks.set(id, kept)
    }
    return view
  }

  hasStackHistory(id: string): boolean {
    const history = this.stacks.get(id)
    return !!history && history.length > 0
  }

  stacksAt(id: string, frame: number): number {
    const history = this.stacks.get(id)
    if (!history || history.length === 0) return 0
    let low = 0
    let high = history.length - 1
    let found = 0
    while (low <= high) {
      const mid = (low + high) >> 1
      if (history[mid].frame <= frame) {
        found = history[mid].value
        low = mid + 1
      } else high = mid - 1
    }
    return found
  }

  isActiveAt(id: string, frame: number): boolean {
    const windows = this.windows.get(id)
    if (!windows) return false
    return windows.some((window) => frame >= window.start && frame < window.end)
  }

  conditionStacksAt(id: string, frame: number): number {
    return this.isActiveAt(id, frame) ? this.stacksAt(id, frame) : 0
  }

  activeIdsAt(frame: number): string[] {
    const out: string[] = []
    for (const [id, windows] of this.windows)
      if (windows.some((window) => frame >= window.start && frame < window.end)) out.push(id)
    return out
  }

  // The latest end among the windows covering `frame`, as that frame sees it.
  remainingFramesAt(id: string, frame: number): number | undefined {
    const windows = this.windows.get(id)
    if (!windows) return undefined
    let end: number | undefined
    for (const window of windows) {
      const endHere = windowEndAt(window, frame)
      if (frame >= window.start && frame < endHere && (end === undefined || endHere > end))
        end = endHere
    }
    return end === undefined ? undefined : end - frame
  }

  windowsOf(id: string): readonly StatusWindow[] {
    return this.windows.get(id) ?? []
  }

  // The window covering `frame` with the furthest end — the one an extension
  // lengthens when several overlap.
  longestActiveWindow(id: string, frame: number): StatusWindow | undefined {
    let found: StatusWindow | undefined
    for (const window of this.windows.get(id) ?? [])
      if (frame >= window.start && frame < window.end && (!found || window.end > found.end))
        found = window
    return found
  }

  sortWindows(): void {
    for (const windows of this.windows.values()) windows.sort((a, b) => a.start - b.start)
  }

  entries(): IterableIterator<[string, StatusWindow[]]> {
    return this.windows.entries()
  }
}
