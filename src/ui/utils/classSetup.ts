import type { Inputs } from "../../engine/types"
import { allowedInnerWaysForClass, defaultArsenalForClass, swapArsenal } from "../../engine/panel"
import { slotInnerWayId } from "../../definitions/innerWays/registry"
import { getDefaultTalentsForClass } from "../../definitions/baseStats"

export function syncClassPermanent(inputs: Inputs, classId: string): Inputs {
  const talents =
    inputs.classId === classId && inputs.martialArtsTalents.length > 0
      ? inputs.martialArtsTalents
      : getDefaultTalentsForClass(classId)
  const withArsenal = swapArsenal(inputs, defaultArsenalForClass(classId))
  const allowed = new Set(allowedInnerWaysForClass(classId))
  const kept = new Set<string>()
  return {
    ...withArsenal,
    classId,
    mindMethods: withArsenal.mindMethods.map((slot) => {
      const innerWayId = slotInnerWayId(slot)
      if (!innerWayId || !allowed.has(innerWayId) || kept.has(innerWayId)) {
        return { name: "", stacks: "" }
      }
      kept.add(innerWayId)
      return slot
    }) as Inputs["mindMethods"],
    martialArtsTalents: talents,
  }
}
