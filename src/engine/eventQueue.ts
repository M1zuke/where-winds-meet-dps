export const EVENT_KIND_PRIORITY = {
  recall: -1,
  castStart: -0.5,
  hit: 0,
  tickLaunch: 0.5,
  tick: 1,
  extra: 2,
  echoRelease: 3,
} as const

export type EventKind = keyof typeof EVENT_KIND_PRIORITY

export interface QueuedEvent {
  kind: EventKind
  frame: number
}

interface QueueEntry<Event extends QueuedEvent> {
  event: Event
  seq: number
}

export class EventQueue<Event extends QueuedEvent> {
  private readonly heap: QueueEntry<Event>[] = []
  private nextSeq = 0

  get size(): number {
    return this.heap.length
  }

  push(event: Event): void {
    this.heap.push({ event, seq: this.nextSeq++ })
    let index = this.heap.length - 1
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (!this.precedes(this.heap[index], this.heap[parent])) break
      ;[this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]]
      index = parent
    }
  }

  pop(): Event | undefined {
    if (this.heap.length === 0) return undefined
    const first = this.heap[0]
    const last = this.heap.pop()!
    if (this.heap.length > 0) {
      this.heap[0] = last
      let index = 0
      for (;;) {
        const left = 2 * index + 1
        const right = left + 1
        let earliest = index
        if (left < this.heap.length && this.precedes(this.heap[left], this.heap[earliest]))
          earliest = left
        if (right < this.heap.length && this.precedes(this.heap[right], this.heap[earliest]))
          earliest = right
        if (earliest === index) break
        ;[this.heap[index], this.heap[earliest]] = [this.heap[earliest], this.heap[index]]
        index = earliest
      }
    }
    return first.event
  }

  *drain(): Generator<Event> {
    for (let event = this.pop(); event; event = this.pop()) yield event
  }

  private precedes(left: QueueEntry<Event>, right: QueueEntry<Event>): boolean {
    if (left.event.frame !== right.event.frame) return left.event.frame < right.event.frame
    const leftPriority = EVENT_KIND_PRIORITY[left.event.kind]
    const rightPriority = EVENT_KIND_PRIORITY[right.event.kind]
    if (leftPriority !== rightPriority) return leftPriority < rightPriority
    return left.seq < right.seq
  }
}
