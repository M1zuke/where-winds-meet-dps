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
