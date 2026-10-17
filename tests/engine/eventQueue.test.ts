import { afterEach, describe, expect, it, vi } from "vitest"
import { EventQueue, type QueuedEvent } from "../../src/engine/eventQueue"

function queueWithPoppedFrame(
  poppedFrame: number,
  onLateEvent?: (frame: number, lastPoppedFrame: number) => void,
) {
  const queue = new EventQueue<QueuedEvent>(onLateEvent)
  queue.push({ kind: "hit", frame: poppedFrame })
  queue.pop()
  return queue
}

describe("events sharing a frame", () => {
  it("run a deferred grant ahead of a cast start on that frame", () => {
    const queue = new EventQueue<QueuedEvent>()
    queue.push({ kind: "castStart", frame: 50 })
    queue.push({ kind: "deferredGrant", frame: 50, subFrame: 50 })
    queue.push({ kind: "hit", frame: 50 })
    expect([queue.pop(), queue.pop(), queue.pop()].map((event) => event?.kind)).toEqual([
      "deferredGrant",
      "castStart",
      "hit",
    ])
  })

  it("order deferred grants of one kind by the exact time they land at", () => {
    const queue = new EventQueue<QueuedEvent & { label: string }>()
    queue.push({ kind: "deferredGrant", frame: 50, subFrame: 49.8, label: "later pushed" })
    queue.push({ kind: "deferredGrant", frame: 50, subFrame: 49.2, label: "earlier landing" })
    queue.push({ kind: "deferredGrant", frame: 50, subFrame: 49.8, label: "tied, pushed last" })
    expect([queue.pop(), queue.pop(), queue.pop()].map((event) => event?.label)).toEqual([
      "earlier landing",
      "later pushed",
      "tied, pushed last",
    ])
  })
})

describe("an event queued before the last popped frame", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("throws in development", () => {
    vi.stubEnv("DEV", true)
    expect(() => queueWithPoppedFrame(100).push({ kind: "hit", frame: 40 })).toThrow()
  })

  it("is clamped to the last popped frame and reported in production", () => {
    vi.stubEnv("DEV", false)
    const reported: [number, number][] = []
    const queue = queueWithPoppedFrame(100, (frame, lastPoppedFrame) =>
      reported.push([frame, lastPoppedFrame]),
    )
    queue.push({ kind: "hit", frame: 40 })
    expect(queue.pop()?.frame).toBe(100)
    expect(reported).toEqual([[40, 100]])
  })
})
