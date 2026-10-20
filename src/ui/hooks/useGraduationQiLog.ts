import { useEffect, useMemo, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { QiDamageLog } from "../../engine/qiBar"
import { graduationQiSourceInputs } from "../../engine/graduation"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"

export function useGraduationQiLog(inputs: Inputs): QiDamageLog | null {
  const source = useMemo(() => graduationQiSourceInputs(inputs), [inputs])
  const [qiDamageLog, setQiDamageLog] = useState<QiDamageLog | null>(
    () => retainedResponse("graduationQiLog")?.qiDamageLog ?? null,
  )

  useEffect(() => {
    return subscribeToDpsWorker("graduationQiLog", (response) =>
      setQiDamageLog(response.qiDamageLog),
    )
  }, [])

  useEffect(() => {
    if (source) postToDpsWorker({ kind: "graduationQiLog", source })
  }, [source])

  return source ? qiDamageLog : null
}
