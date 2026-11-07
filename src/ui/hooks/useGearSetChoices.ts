import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { GearSetChoicesWorkerResponse } from "../../engine/dpsWorker"
import type { SetChoiceTarget } from "../../engine/setChoice"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface GearSetChoicesResult {
  data: Pick<GearSetChoicesWorkerResponse, "currentDps" | "dpsByChoice"> | null
  isPending: boolean
}

const NO_TARGET_RESULT: GearSetChoicesResult = { data: null, isPending: false }

function sameTarget(left: SetChoiceTarget, right: SetChoiceTarget): boolean {
  if (left.kind === "bow") return right.kind === "bow" && right.slot === left.slot
  return right.kind === "piece" && right.pieceId === left.pieceId
}

export function useGearSetChoices(
  inputs: Inputs,
  target: SetChoiceTarget | null,
  applyToGroup: boolean,
): GearSetChoicesResult {
  const [received, setReceived] = useState<GearSetChoicesWorkerResponse | null>(() =>
    retainedResponse("gearSetChoices"),
  )
  const isPending = useDpsWorkerPending("gearSetChoices")

  useEffect(() => {
    return subscribeToDpsWorker("gearSetChoices", setReceived)
  }, [])

  useEffect(() => {
    if (!target) return
    postToDpsWorker({ kind: "gearSetChoices", inputs, target, applyToGroup })
  }, [inputs, target, applyToGroup])

  if (!target) return NO_TARGET_RESULT
  const matches =
    received !== null &&
    received.applyToGroup === applyToGroup &&
    sameTarget(received.target, target)
  return { data: matches ? received : null, isPending }
}
