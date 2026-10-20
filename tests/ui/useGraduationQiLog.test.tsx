import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { WorkerRequest, WorkerResponse } from "../../src/engine/dpsWorker"

const { created, MockWorker } = vi.hoisted(() => {
  const instances: { posted: unknown[]; onmessage: ((event: { data: unknown }) => void) | null }[] =
    []
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

const { defaultInputs } = await import("../../src/engine/defaults")
const { classDefinition } = await import("../../src/definitions/classes/registry")
const { useGraduationQiLog } = await import("../../src/ui/hooks/useGraduationQiLog")

const FOLLOWING = {
  ...defaultInputs,
  graduationBuildId: classDefinition(defaultInputs.classId)!.graduationBuilds[0].id,
}

const LOG = [{ frame: 10, qi: 1, kind: "direct" as const }]

function requestsPosted(): Extract<WorkerRequest, { kind: "graduationQiLog" }>[] {
  return created
    .flatMap((worker) => worker.posted as WorkerRequest[])
    .filter(
      (request): request is Extract<WorkerRequest, { kind: "graduationQiLog" }> =>
        request.kind === "graduationQiLog",
    )
}

function answer(reqId: number): void {
  const response: WorkerResponse = { kind: "graduationQiLog", reqId, qiDamageLog: LOG }
  const owner = created.find((worker) =>
    (worker.posted as { reqId: number }[]).some((request) => request.reqId === reqId),
  )
  act(() => owner?.onmessage?.({ data: response }))
}

beforeEach(() => {
  created.length = 0
  Object.defineProperty(navigator, "hardwareConcurrency", { value: 2, configurable: true })
})

describe("useGraduationQiLog", () => {
  it("returns null and posts nothing without a followed build or with the setting off", () => {
    const withoutBuild = renderHook(() =>
      useGraduationQiLog({
        ...defaultInputs,
        graduationBuildId: null,
        customGraduationBuild: null,
      }),
    )
    const settingOff = renderHook(() =>
      useGraduationQiLog({ ...FOLLOWING, useGraduationQiBreak: false }),
    )

    expect(withoutBuild.result.current).toBeNull()
    expect(settingOff.result.current).toBeNull()
    expect(requestsPosted()).toHaveLength(0)
  })

  it("keeps the same log reference when a gear edit leaves the source unchanged", async () => {
    const { result, rerender } = renderHook(({ inputs }) => useGraduationQiLog(inputs), {
      initialProps: { inputs: FOLLOWING },
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    const [firstRequest] = requestsPosted()
    answer(firstRequest.reqId)
    const answeredLog = result.current
    expect(answeredLog).toBe(LOG)

    const gearEdited = {
      ...FOLLOWING,
      inventory: classDefinition(FOLLOWING.classId)!.graduationBuilds[0].gear.map((piece) => ({
        ...piece,
      })),
    }
    await act(async () => {
      rerender({ inputs: gearEdited })
      await Promise.resolve()
    })

    expect(result.current).toBe(answeredLog)
    expect(requestsPosted()).toHaveLength(1)
  })
})
