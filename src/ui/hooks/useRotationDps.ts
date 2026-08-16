import { useEffect, useMemo, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { Rotation } from "../../engine/rotation"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

const NO_DPS: Record<string, number> = {}

export interface RotationDpsResult {
  dpsByOptionId: Record<string, number>
  isPending: boolean
}

export function useRotationDps(
  inputs: Inputs,
  options: { id: string; rotation: Rotation | null }[],
): RotationDpsResult {
  const [dpsByOptionId, setDpsByOptionId] = useState<Record<string, number> | null>(
    () => retainedResponse("rotationDps")?.dpsByOptionId ?? null,
  )
  const isPending = useDpsWorkerPending("rotationDps")

  const request = useMemo(
    () => options.map((option) => ({ optionId: option.id, rotation: option.rotation })),
    [options],
  )

  useEffect(() => {
    return subscribeToDpsWorker("rotationDps", (response) =>
      setDpsByOptionId(response.dpsByOptionId),
    )
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "rotationDps", inputs, options: request })
  }, [inputs, request])

  return { dpsByOptionId: dpsByOptionId ?? NO_DPS, isPending }
}
