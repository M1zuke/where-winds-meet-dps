import { useEffect, useState } from "react"
import type { StoredProfile } from "../../engine/types"
import type { Skill } from "../../engine/skill"
import type { Buff } from "../../engine/buff"
import type { Debuff } from "../../engine/debuff"
import type { ProfileMetrics, ProfileMetricsWorkerResponse } from "../../engine/dpsWorker"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface ProfileMetricsResult {
  metricsByProfileId: Record<string, ProfileMetrics> | null
  isPending: boolean
}

function profileMetrics(
  response: ProfileMetricsWorkerResponse | null,
): Record<string, ProfileMetrics> | null {
  return response?.metricsByProfileId ?? null
}

export function useProfileMetrics(
  profiles: StoredProfile[],
  customSkills: Skill[],
  customBuffs: Buff[],
  customDebuffs: Debuff[],
): ProfileMetricsResult {
  const [metricsByProfileId, setMetricsByProfileId] = useState<Record<
    string,
    ProfileMetrics
  > | null>(() => profileMetrics(retainedResponse("profileMetrics")))
  const isPending = useDpsWorkerPending("profileMetrics")

  useEffect(() => {
    return subscribeToDpsWorker("profileMetrics", (response) =>
      setMetricsByProfileId(profileMetrics(response)),
    )
  }, [])

  useEffect(() => {
    postToDpsWorker({
      kind: "profileMetrics",
      profiles: profiles.map((profile) => ({ id: profile.id, inputs: profile.inputs })),
      customSkills,
      customBuffs,
      customDebuffs,
    })
  }, [profiles, customSkills, customBuffs, customDebuffs])

  return { metricsByProfileId, isPending }
}
