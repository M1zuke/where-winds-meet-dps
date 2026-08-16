import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { WorkerRequest, WorkerResponse } from "../../src/engine/dpsWorker"
import type { UnsentRequest } from "../../src/ui/hooks/dpsWorkerClient"
import { defaultInputs } from "../../src/engine/defaults"
import { CACHE_ENTRIES_PER_KIND } from "../../src/ui/hooks/workerResultCache"

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

function rankingRequest(baselineDps = 1000): UnsentRequest {
  return { kind: "ranking", inputs: defaultInputs, baselineDps }
}

function rankingResponse(reqId: number): WorkerResponse {
  return { kind: "ranking", reqId, rows: [] }
}

function respond(workerIndex: number, response: WorkerResponse): void {
  created[workerIndex].onmessage?.({ data: response })
}

function reqIdOfLastPost(workerIndex: number): number {
  const posted = created[workerIndex].posted
  return (posted[posted.length - 1] as WorkerRequest).reqId
}

function parseSimulationRequest(): UnsentRequest {
  return { kind: "parseSimulation", inputs: defaultInputs, rotation: null, runs: 10, seed: 1 }
}

function parseSimulationResponse(reqId: number): WorkerResponse {
  return {
    kind: "parseSimulation",
    reqId,
    runs: [],
    expectedRates: null,
    rotationDuration: 0,
    requestedRuns: 10,
    completedRuns: 10,
    cancelled: false,
    warnings: [],
  }
}

function progressResponse(reqId: number, done: number): WorkerResponse {
  return { kind: "parseSimulationProgress", reqId, done, total: 10 }
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

    client.postToDpsWorker(rankingRequest())
    client.postToDpsWorker(rankingRequest())
    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()

    expect(created).toHaveLength(1)
    expect(created[0].posted).toEqual([{ ...rankingRequest(), reqId: 3 }])
  })

  it("reports pending from the first post until the matching response", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("ranking", () => {})

    expect(client.isDpsWorkerPending("ranking")).toBe(false)
    client.postToDpsWorker(rankingRequest())
    expect(client.isDpsWorkerPending("ranking")).toBe(true)

    await vi.runAllTimersAsync()
    expect(client.isDpsWorkerPending("ranking")).toBe(true)

    respond(0, rankingResponse(reqIdOfLastPost(0)))
    expect(client.isDpsWorkerPending("ranking")).toBe(false)
  })

  it("stays pending when a superseded response arrives before the newest one", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("ranking", () => {})

    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()
    const supersededReqId = reqIdOfLastPost(0)
    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()

    respond(0, rankingResponse(supersededReqId))
    expect(client.isDpsWorkerPending("ranking")).toBe(true)

    respond(0, rankingResponse(reqIdOfLastPost(0)))
    expect(client.isDpsWorkerPending("ranking")).toBe(false)
  })

  it("delivers a response only to listeners of its own kind", async () => {
    const client = await freshClient()
    const rankingSeen: number[] = []
    const setTilesSeen: number[] = []
    client.subscribeToDpsWorker("ranking", ({ reqId }) => rankingSeen.push(reqId))
    client.subscribeToDpsWorker("setTiles", ({ reqId }) => setTilesSeen.push(reqId))

    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()
    const reqId = reqIdOfLastPost(0)
    respond(0, rankingResponse(reqId))

    expect(rankingSeen).toEqual([reqId])
    expect(setTilesSeen).toEqual([])
  })

  it("discards a response older than the newest one already delivered", async () => {
    const client = await freshClient()
    const seen: number[] = []
    client.subscribeToDpsWorker("ranking", ({ reqId }) => seen.push(reqId))

    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()
    const newest = reqIdOfLastPost(0)
    respond(0, rankingResponse(newest))
    respond(0, rankingResponse(newest - 1))

    expect(seen).toEqual([newest])
  })

  it("numbers requests itself so a remounted listener still gets its results", async () => {
    const client = await freshClient()

    const firstVisit = client.subscribeToDpsWorker("ranking", () => {})
    for (const change of [1, 2, 3]) {
      client.postToDpsWorker(rankingRequest(1000 + change))
      await vi.runAllTimersAsync()
      respond(0, rankingResponse(reqIdOfLastPost(0)))
    }
    firstVisit()

    const seen: number[] = []
    client.subscribeToDpsWorker("ranking", ({ reqId }) => seen.push(reqId))
    client.postToDpsWorker(rankingRequest(2000))
    await vi.runAllTimersAsync()
    respond(0, rankingResponse(reqIdOfLastPost(0)))

    expect(seen).toEqual([reqIdOfLastPost(0)])
  })

  it("withholds a response the previous listener abandoned from the next one", async () => {
    const client = await freshClient()

    const firstVisit = client.subscribeToDpsWorker("ranking", () => {})
    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()
    const abandonedReqId = reqIdOfLastPost(0)
    firstVisit()

    const seen: number[] = []
    client.subscribeToDpsWorker("ranking", ({ reqId }) => seen.push(reqId))
    respond(0, rankingResponse(abandonedReqId))

    expect(seen).toEqual([])
  })

  it("reuses one worker across resubscribe cycles", async () => {
    const client = await freshClient()

    for (const _visit of [0, 1, 2]) {
      const unsubscribe = client.subscribeToDpsWorker("ranking", () => {})
      client.postToDpsWorker(rankingRequest())
      await vi.runAllTimersAsync()
      unsubscribe()
    }

    expect(created).toHaveLength(1)
  })

  it("drops a queued request when the last listener of its kind unsubscribes", async () => {
    const client = await freshClient()
    const unsubscribe = client.subscribeToDpsWorker("ranking", () => {})

    client.postToDpsWorker(rankingRequest())
    unsubscribe()
    await vi.runAllTimersAsync()

    expect(created).toHaveLength(0)
    expect(client.isDpsWorkerPending("ranking")).toBe(false)
  })

  it("spreads every request kind over a pool bounded by the core count", async () => {
    const client = await freshClient(3)
    const kinds = [
      "dpsDeltas",
      "retunement",
      "reattunement",
      "wordMax",
      "ranking",
      "setTiles",
      "graduation",
    ] as const
    for (const kind of kinds) {
      client.subscribeToDpsWorker(kind, () => {})
      client.postToDpsWorker({ ...rankingRequest(), kind } as UnsentRequest)
      await vi.runAllTimersAsync()
    }

    expect(created).toHaveLength(2)
    expect(created.every((worker) => worker.posted.length > 0)).toBe(true)
  })

  it("posts a parse simulation without waiting out the debounce", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("parseSimulation", () => {})

    client.postToDpsWorker(parseSimulationRequest())

    expect(created[0].posted).toHaveLength(1)
  })

  it("routes progress without retiring the request", async () => {
    const client = await freshClient()
    const seen: number[] = []
    client.subscribeToDpsWorker("parseSimulation", () => seen.push(-1))
    client.subscribeToDpsWorkerProgress("parseSimulation", ({ done }) => seen.push(done))

    client.postToDpsWorker(parseSimulationRequest())
    const reqId = reqIdOfLastPost(0)
    respond(0, progressResponse(reqId, 3))
    respond(0, progressResponse(reqId, 7))

    expect(seen).toEqual([3, 7])
    expect(client.isDpsWorkerPending("parseSimulation")).toBe(true)

    respond(0, parseSimulationResponse(reqId))
    expect(seen).toEqual([3, 7, -1])
    expect(client.isDpsWorkerPending("parseSimulation")).toBe(false)
  })

  it("ignores progress from a superseded run", async () => {
    const client = await freshClient()
    const seen: number[] = []
    client.subscribeToDpsWorker("parseSimulation", () => {})
    client.subscribeToDpsWorkerProgress("parseSimulation", ({ done }) => seen.push(done))

    client.postToDpsWorker(parseSimulationRequest())
    const stale = reqIdOfLastPost(0)
    client.postToDpsWorker(parseSimulationRequest())

    respond(0, progressResponse(stale, 5))
    expect(seen).toEqual([])
  })

  it("tells the worker to stop the run it is superseding", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("parseSimulation", () => {})

    client.postToDpsWorker(parseSimulationRequest())
    const first = reqIdOfLastPost(0)
    client.postToDpsWorker(parseSimulationRequest())

    expect(created[0].posted[1]).toEqual({ kind: "parseSimulationCancel", reqId: first })
  })

  it("keeps the partial result of a run the user cancelled", async () => {
    const client = await freshClient()
    const delivered: number[] = []
    client.subscribeToDpsWorker("parseSimulation", (response) => delivered.push(response.reqId))

    client.postToDpsWorker(parseSimulationRequest())
    const reqId = reqIdOfLastPost(0)
    client.cancelDpsWorkerRequest("parseSimulation")

    expect(created[0].posted[1]).toEqual({ kind: "parseSimulationCancel", reqId })

    respond(0, parseSimulationResponse(reqId))
    expect(delivered).toEqual([reqId])
  })

  it("cancels the sweep when the last listener unsubscribes", async () => {
    const client = await freshClient()
    const stop = client.subscribeToDpsWorker("parseSimulation", () => {})

    client.postToDpsWorker(parseSimulationRequest())
    const reqId = reqIdOfLastPost(0)
    stop()

    expect(created[0].posted[1]).toEqual({ kind: "parseSimulationCancel", reqId })
  })

  it("answers a repeated request from the cache instead of the worker", async () => {
    const client = await freshClient()
    const seen: number[] = []
    client.subscribeToDpsWorker("ranking", ({ reqId }) => seen.push(reqId))

    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()
    const computed = reqIdOfLastPost(0)
    respond(0, rankingResponse(computed))

    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()

    expect(created[0].posted).toHaveLength(1)
    expect(seen).toEqual([computed, computed + 1])
  })

  it("posts again when one field of the request differs", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("ranking", () => {})

    client.postToDpsWorker(rankingRequest(1000))
    await vi.runAllTimersAsync()
    respond(0, rankingResponse(reqIdOfLastPost(0)))

    client.postToDpsWorker(rankingRequest(1001))
    await vi.runAllTimersAsync()

    expect(created[0].posted).toHaveLength(2)
  })

  it("never answers a parse simulation from the cache", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("parseSimulation", () => {})

    client.postToDpsWorker(parseSimulationRequest())
    respond(0, parseSimulationResponse(reqIdOfLastPost(0)))
    client.postToDpsWorker(parseSimulationRequest())

    expect(
      created[0].posted.filter((post) => (post as WorkerRequest).kind === "parseSimulation"),
    ).toHaveLength(2)
  })

  it("stays unpending through a cached answer", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("ranking", () => {})

    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()
    respond(0, rankingResponse(reqIdOfLastPost(0)))

    client.postToDpsWorker(rankingRequest())
    expect(client.isDpsWorkerPending("ranking")).toBe(false)
  })

  it("evicts the oldest signature once the per-kind cap is passed", async () => {
    const client = await freshClient()
    client.subscribeToDpsWorker("ranking", () => {})

    for (let entry = 0; entry <= CACHE_ENTRIES_PER_KIND; entry++) {
      client.postToDpsWorker(rankingRequest(1000 + entry))
      await vi.runAllTimersAsync()
      respond(0, rankingResponse(reqIdOfLastPost(0)))
    }
    const postsBeforeReplay = created[0].posted.length

    client.postToDpsWorker(rankingRequest(1000))
    await vi.runAllTimersAsync()

    expect(created[0].posted).toHaveLength(postsBeforeReplay + 1)
  })

  it("hands the last response to a listener that subscribes after it landed", async () => {
    const client = await freshClient()
    const firstVisit = client.subscribeToDpsWorker("ranking", () => {})

    client.postToDpsWorker(rankingRequest())
    await vi.runAllTimersAsync()
    const reqId = reqIdOfLastPost(0)
    respond(0, rankingResponse(reqId))
    firstVisit()

    expect(client.retainedResponse("ranking")?.reqId).toBe(reqId)
  })

  it("has nothing retained for a kind that never answered", async () => {
    const client = await freshClient()

    expect(client.retainedResponse("ranking")).toBeNull()
  })
})
