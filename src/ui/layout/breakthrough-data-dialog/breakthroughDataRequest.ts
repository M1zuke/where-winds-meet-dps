import { defaultBreakthrough } from "../../../definitions/baseStats/breakthroughs"
import { classDefinition } from "../../../definitions/classes/registry"
import { innerWayDefinition } from "../../../definitions/innerWays/registry"
import type { InnerWayDef } from "../../../definitions/innerWays/innerWayDef"

export interface PendingInnerWay {
  id: string
  name: string
  confirmedBreakthrough: number
}

export interface BreakthroughDataRequest {
  classId: string
  className: string
  liveBreakthrough: number
  pendingInnerWays: readonly PendingInnerWay[]
}

export function breakthroughDataRequestFor(
  classId: string,
  now: number = Date.now(),
): BreakthroughDataRequest | null {
  const definition = classDefinition(classId)
  if (!definition) return null
  const liveBreakthrough = defaultBreakthrough(now)
  const pendingInnerWays = definition.innerWays
    .map((innerWayId) => innerWayDefinition(innerWayId))
    .filter(
      (innerWay): innerWay is InnerWayDef =>
        !!innerWay && innerWay.confirmedBreakthrough < liveBreakthrough,
    )
    .map((innerWay) => ({
      id: innerWay.id,
      name: innerWay.name,
      confirmedBreakthrough: innerWay.confirmedBreakthrough,
    }))
  if (pendingInnerWays.length === 0) return null
  return {
    classId: definition.id,
    className: definition.displayName,
    liveBreakthrough,
    pendingInnerWays,
  }
}
