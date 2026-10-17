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
  // Write order, not time order — `asOf` walks it to answer "as this ledger
  // stood before a given write" for a query that must not see its own cause.
  seq?: number
  extensions?: WindowEndEdit[]
  cuts?: WindowEndEdit[]
}

export interface WindowEndEdit {
  frame: number
  amount: number
  owner: number
}

export const UNOWNED = Number.NEGATIVE_INFINITY

export interface StatusView {
  activeIdsAt(frame: number): string[]
  isActiveAt(id: string, frame: number): boolean
  stacksAt(id: string, frame: number): number
  conditionStacksAt(id: string, frame: number): number
  remainingFramesAt(id: string, frame: number): number | undefined
  framesSinceLastEnd(id: string, frame: number): number | undefined
  // The counter counterpart of `framesSinceLastEnd`, for an id with no
  // window to close — see `docs/TIMELINE.md` § "The class-buff system".
  framesSinceStacksBelowThreshold(id: string, frame: number, threshold: number): number | undefined
  windowsOf(id: string): readonly StatusWindow[]
}

// The latest window end at or before `frame` — an in-progress window (its own
// end past `frame`) does not count, so this reads "since it last closed", not
// "since it last opened".
function latestEndAt(windows: Iterable<StatusWindow>, frame: number): number | undefined {
  let latestEnd: number | undefined
  for (const window of windows) {
    const endHere = windowEndAt(window, frame)
    if (endHere <= frame && (latestEnd === undefined || endHere > latestEnd)) latestEnd = endHere
  }
  return latestEnd
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
  const clone = { ...window }
  if (window.extensions) clone.extensions = [...window.extensions]
  if (window.cuts) clone.cuts = [...window.cuts]
  return clone
}

function withoutHiddenEdits(
  window: StatusWindow,
  visible: (owner: number, frame: number) => boolean,
): StatusWindow {
  const clone = cloneWindow(window)
  if (clone.extensions) {
    for (const edit of clone.extensions)
      if (!visible(edit.owner, edit.frame)) clone.end -= edit.amount
    clone.extensions = clone.extensions.filter((edit) => visible(edit.owner, edit.frame))
  }
  if (clone.cuts) {
    for (const edit of clone.cuts) if (!visible(edit.owner, edit.frame)) clone.end += edit.amount
    clone.cuts = clone.cuts.filter((edit) => visible(edit.owner, edit.frame))
  }
  return clone
}

export interface WindowObserver {
  opened?(id: string, window: StatusWindow): void
  extended?(id: string, window: StatusWindow): void
  cut?(id: string, window: StatusWindow): void
}

export class StatusLedger implements StatusView {
  private readonly windows = new Map<string, StatusWindow[]>()
  private readonly windowIds = new WeakMap<StatusWindow, string>()
  private observer: WindowObserver | null = null
  private readonly stacks = new Map<
    string,
    Array<{ frame: number; value: number; owner: number; seq: number }>
  >()
  private readonly permanentOpened = new Set<string>()
  private writeSeq = 0

  constructor(
    private readonly spanStart: number,
    private readonly spanEnd: number,
  ) {}

  // How many writes this ledger has taken so far — pair with `asOf` to give a
  // query a view that stops just before a write it must not see.
  mark(): number {
    return this.writeSeq
  }

  observeWindows(observer: WindowObserver): void {
    this.observer = observer
  }

  pushWindow(id: string, start: number, end: number, owner: number = UNOWNED): void {
    const window: StatusWindow = { start, end, owner, seq: this.writeSeq++ }
    const existing = this.windows.get(id)
    if (existing) existing.push(window)
    else this.windows.set(id, [window])
    this.windowIds.set(window, id)
    this.observer?.opened?.(id, window)
  }

  openPermanent(id: string, causedAtFrame?: number): void {
    if (this.permanentOpened.has(id)) return
    this.permanentOpened.add(id)
    this.pushWindow(id, Math.max(this.spanStart, causedAtFrame ?? this.spanStart), this.spanEnd)
  }

  constrainWindows(id: string, intervals: readonly { start: number; end: number }[]): void {
    this.windows.set(
      id,
      (this.windows.get(id) ?? []).flatMap((window) => {
        const interval = intervals.find((candidate) => candidate.start === window.start)
        if (!interval || interval.end <= interval.start) return []
        return [{ ...window, end: Math.min(window.end, interval.end) }]
      }),
    )
  }

  recordStack(id: string, frame: number, value: number, owner: number = UNOWNED): void {
    const entry = { frame, value, owner, seq: this.writeSeq++ }
    const existing = this.stacks.get(id)
    if (!existing) {
      this.stacks.set(id, [entry])
      return
    }
    let insertAt = existing.length
    while (insertAt > 0 && existing[insertAt - 1].frame > frame) insertAt--
    existing.splice(insertAt, 0, entry)
  }

  extendWindow(window: StatusWindow, frame: number, nextEnd: number, owner: number): void {
    const amount = nextEnd - window.end
    window.end = nextEnd
    if (amount > 0) (window.extensions ??= []).push({ frame, amount, owner })
    const id = this.windowIds.get(window)
    if (id !== undefined) this.observer?.extended?.(id, window)
  }

  cutWindowsAt(id: string, frame: number, owner: number): void {
    for (const window of this.windows.get(id) ?? [])
      if (window.start < frame && frame < window.end) this.cutWindow(window, frame, owner)
  }

  cutWindow(window: StatusWindow, frame: number, owner: number): void {
    const amount = window.end - frame
    window.end = frame
    if (amount > 0) (window.cuts ??= []).push({ frame, amount, owner })
    const id = this.windowIds.get(window)
    if (id !== undefined) this.observer?.cut?.(id, window)
  }

  throughOwner(ownerLimit: number, unownedThroughFrame = Number.POSITIVE_INFINITY): StatusLedger {
    const visible = (owner: number, frame: number) =>
      owner <= ownerLimit && (owner !== UNOWNED || frame <= unownedThroughFrame)
    const view = new StatusLedger(this.spanStart, this.spanEnd)
    for (const [id, windows] of this.windows) {
      const kept = windows.filter((window) => visible(window.owner ?? UNOWNED, window.start))
      if (kept.length > 0)
        view.windows.set(
          id,
          kept.map((window) => withoutHiddenEdits(window, visible)),
        )
    }
    for (const [id, history] of this.stacks) {
      const kept = history.filter((entry) => visible(entry.owner, entry.frame))
      if (kept.length > 0) view.stacks.set(id, kept)
    }
    return view
  }

  hasStackHistory(id: string): boolean {
    const history = this.stacks.get(id)
    return !!history && history.length > 0
  }

  stackHistory(id: string): readonly { frame: number; value: number }[] {
    return (this.stacks.get(id) ?? []).map(({ frame, value }) => ({ frame, value }))
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

  framesSinceLastEnd(id: string, frame: number): number | undefined {
    const latestEnd = latestEndAt(this.windows.get(id) ?? [], frame)
    return latestEnd === undefined ? undefined : frame - latestEnd
  }

  framesSinceStacksBelowThreshold(
    id: string,
    frame: number,
    threshold: number,
  ): number | undefined {
    const history = this.stacks.get(id)
    if (!history) return undefined
    let latestDrop: number | undefined
    let previousValue = 0
    for (const entry of history) {
      if (entry.frame > frame) break
      if (previousValue >= threshold && entry.value < threshold) latestDrop = entry.frame
      previousValue = entry.value
    }
    return latestDrop === undefined ? undefined : frame - latestDrop
  }

  windowsOf(id: string): readonly StatusWindow[] {
    return this.windows.get(id) ?? []
  }

  // A view that only sees writes strictly before `beforeSeq` — what a hit's
  // own damage query reads, so a status its own trigger just opened cannot
  // reach its own hit.
  asOf(beforeSeq: number): StatusView {
    const windowsFor = (id: string): StatusWindow[] =>
      (this.windows.get(id) ?? []).filter((window) => (window.seq ?? 0) < beforeSeq)
    const activeAt = (id: string, frame: number): boolean =>
      windowsFor(id).some((window) => frame >= window.start && frame < window.end)
    const stackValueAt = (id: string, frame: number): number => {
      let bestFrame = Number.NEGATIVE_INFINITY
      let bestSeq = -1
      let found = 0
      for (const entry of this.stacks.get(id) ?? []) {
        if (entry.seq >= beforeSeq || entry.frame > frame) continue
        if (entry.frame > bestFrame || (entry.frame === bestFrame && entry.seq > bestSeq)) {
          bestFrame = entry.frame
          bestSeq = entry.seq
          found = entry.value
        }
      }
      return found
    }
    return {
      activeIdsAt: (frame) => {
        const out: string[] = []
        for (const id of this.windows.keys()) if (activeAt(id, frame)) out.push(id)
        return out
      },
      isActiveAt: activeAt,
      stacksAt: stackValueAt,
      conditionStacksAt: (id, frame) => (activeAt(id, frame) ? stackValueAt(id, frame) : 0),
      remainingFramesAt: (id, frame) => {
        let end: number | undefined
        for (const window of windowsFor(id)) {
          const endHere = windowEndAt(window, frame)
          if (frame >= window.start && frame < endHere && (end === undefined || endHere > end))
            end = endHere
        }
        return end === undefined ? undefined : end - frame
      },
      framesSinceLastEnd: (id, frame) => {
        const latestEnd = latestEndAt(windowsFor(id), frame)
        return latestEnd === undefined ? undefined : frame - latestEnd
      },
      framesSinceStacksBelowThreshold: (id, frame, threshold) => {
        let latestDrop: number | undefined
        let previousValue = 0
        for (const entry of this.stacks.get(id) ?? []) {
          if (entry.seq >= beforeSeq || entry.frame > frame) continue
          if (previousValue >= threshold && entry.value < threshold) latestDrop = entry.frame
          previousValue = entry.value
        }
        return latestDrop === undefined ? undefined : frame - latestDrop
      },
      windowsOf: windowsFor,
    }
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
