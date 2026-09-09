import { useCallback, useEffect, useState } from "react"
import type { ParseRunDetailWorkerResponse } from "../../engine/dpsWorker"
import type { Inputs, OutcomeCounts, SkillTickResult } from "../../engine/types"
import type { Rotation } from "../../engine/rotation"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"

export interface ParseRunDetail {
  seed: number
  totalDamage: number
  dps: number
  rotationDuration: number
  perSkill: SkillTickResult[]
  outcomeCounts: OutcomeCounts
  outcomeDamage: OutcomeCounts
}

export interface ParseRunDetailRequest {
  inputs: Inputs
  rotation: Rotation | null
  seed: number
}

export interface ParseRunDetailState {
  detail: ParseRunDetail | null
  request(request: ParseRunDetailRequest): void
}

function projectDetail(response: ParseRunDetailWorkerResponse | null): ParseRunDetail | null {
  if (!response) return null
  return {
    seed: response.seed,
    totalDamage: response.totalDamage,
    dps: response.dps,
    rotationDuration: response.rotationDuration,
    perSkill: response.perSkill,
    outcomeCounts: response.outcomeCounts,
    outcomeDamage: response.outcomeDamage,
  }
}

export function useParseRunDetail(): ParseRunDetailState {
  const [detail, setDetail] = useState<ParseRunDetail | null>(() =>
    projectDetail(retainedResponse("parseRunDetail")),
  )

  useEffect(
    () => subscribeToDpsWorker("parseRunDetail", (response) => setDetail(projectDetail(response))),
    [],
  )

  const request = useCallback(({ inputs, rotation, seed }: ParseRunDetailRequest) => {
    postToDpsWorker({ kind: "parseRunDetail", inputs, rotation, seed })
  }, [])

  return { detail, request }
}
