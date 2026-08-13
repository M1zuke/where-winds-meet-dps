import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { WorkerRequest, WorkerResponse } from "../../src/engine/dpsWorker"
import { defaultInputs } from "../../src/engine/defaults"

const { created, MockWorker } = vi.hoisted(() => {
  const instances: {
    posted: unknown[]
    onmessage: ((event: { data: unknown }) => void) | null
  }[] = []
  class Mock {
    posted: unknown[] = []
    onmessage: ((event: { data: unknown }) => void) | null = null
    constructor() {
      instances.push(this)
    }
    postMessage(request: unknown) {
      this.posted.push(request)
    }
    terminate() {}
  }
  return { created: instances, MockWorker: Mock }
})

vi.mock("../../src/engine/dpsWorker?worker", () => ({ default: MockWorker }))

type Client = typeof import("../../src/ui/hooks/dpsWorkerClient")

async function freshClient(cores = 8): Promise<Client> {
  created.length = 0
  vi.resetModules()
  Object.defineProperty(navigator, "hardwareConcurrency", { value: cores, configurable: true })
  return import("../../src/ui/hooks/dpsWorkerClient")
}

function rankingRequest(reqId: number): WorkerRequest {
  return { kind: "ranking", reqId, inputs: defaultInputs, baselineDps: 1000 }
}

function rankingResponse(reqId: number): WorkerResponse {
  return { kind: "ranking", reqId, rows: [] }
}

function respond(workerIndex: number, response: WorkerResponse): void {
  created[workerIndex].onmessage?.({ data: response })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("dpsWorkerClient", () => {
  it("coalesces rapid posts of one kind into a single worker message", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("ranking", () => {})

    client.postToDpsWorker(rankingRequest(1))
    client.postToDpsWorker(rankingRequest(2))
    client.postToDpsWorker(rankingRequest(3))
    await vi.runAllTimersAsync()

    expect(created).toHaveLength(1)
    expect(created[0].posted).toEqual([rankingRequest(3)])
  })

  it("reports pending from the first post until the matching response", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("ranking", () => {})

    expect(client.isDpsWorkerPending("ranking")).toBe(false)
    client.postToDpsWorker(rankingRequest(1))
    expect(client.isDpsWorkerPending("ranking")).toBe(true)

    await vi.runAllTimersAsync()
    expect(client.isDpsWorkerPending("ranking")).toBe(true)

    respond(0, rankingResponse(1))
    expect(client.isDpsWorkerPending("ranking")).toBe(false)
  })

  it("stays pending when a superseded response arrives before the newest one", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("ranking", () => {})

    client.postToDpsWorker(rankingRequest(1))
    await vi.runAllTimersAsync()
    client.postToDpsWorker(rankingRequest(2))
    await vi.runAllTimersAsync()

    respond(0, rankingResponse(1))
    expect(client.isDpsWorkerPending("ranking")).toBe(true)

    respond(0, rankingResponse(2))
    expect(client.isDpsWorkerPending("ranking")).toBe(false)
  })

  it("delivers a response only to listeners of its own kind", async () => {
    const client = await freshClient()
    const rankingSeen: number[] = []
    const setTilesSeen: number[] = []
    client.subscribeToDpsWorker("ranking", ({ reqId }) => rankingSeen.push(reqId))
    client.subscribeToDpsWorker("setTiles", ({ reqId }) => setTilesSeen.push(reqId))

    client.postToDpsWorker(rankingRequest(1))
    await vi.runAllTimersAsync()
    respond(0, rankingResponse(1))

    expect(rankingSeen).toEqual([1])
    expect(setTilesSeen).toEqual([])
  })

  it("discards a response older than the newest one already delivered", async () => {
    const client = await freshClient()
    const seen: number[] = []
    client.subscribeToDpsWorker("ranking", ({ reqId }) => seen.push(reqId))

    client.postToDpsWorker(rankingRequest(2))
    await vi.runAllTimersAsync()
    respond(0, rankingResponse(2))
    respond(0, rankingResponse(1))

    expect(seen).toEqual([2])
  })

  it("reuses one worker across resubscribe cycles", async () => {
    const client = await freshClient()

    for (const _visit of [0, 1, 2]) {
      const unsubscribe = client.subscribeToDpsWorker("ranking", () => {})
      client.postToDpsWorker(rankingRequest(1))
      await vi.runAllTimersAsync()
      unsubscribe()
    }

    expect(created).toHaveLength(1)
  })

  it("drops a queued request when the last listener of its kind unsubscribes", async () => {
    const client = await freshClient()
    const unsubscribe = client.subscribeToDpsWorker("ranking", () => {})

    client.postToDpsWorker(rankingRequest(1))
    unsubscribe()
    await vi.runAllTimersAsync()

    expect(created).toHaveLength(0)
    expect(client.isDpsWorkerPending("ranking")).toBe(false)
  })

  it("spreads every request kind over a pool bounded by the core count", async () => {
    const client = await freshClient(3)
    const kinds: WorkerRequest["kind"][] = [
      "dpsDeltas",
      "retunement",
      "reattunement",
      "wordMax",
      "ranking",
      "setTiles",
      "graduation",
    ]
    for (const kind of kinds) {
      client.subscribeToDpsWorker(kind, () => {})
      client.postToDpsWorker({ ...rankingRequest(1), kind } as WorkerRequest)
      await vi.runAllTimersAsync()
    }

    expect(created).toHaveLength(2)
    expect(created.every((worker) => worker.posted.length > 0)).toBe(true)
  })
})
