import type { Inputs } from "../../engine/types"
import {
  allowedInnerWaysForClass,
  defaultArsenalForClass,
  getSchool,
  swapArsenal,
} from "../../engine/panel"
import { getDefaultTalentsForClass } from "../../definitions/baseStats"

export function syncClassPermanent(inputs: Inputs, classId: string): Inputs {
  const school = getSchool(classId)
  const lockedName = school.classMindGroup ?? ""
  const talents =
    inputs.classId === classId && inputs.martialArtsTalents.length > 0
      ? inputs.martialArtsTalents
      : getDefaultTalentsForClass(classId)
  const withArsenal = swapArsenal(inputs, defaultArsenalForClass(classId))
  const allowed = new Set(allowedInnerWaysForClass(classId))
  return {
    ...withArsenal,
    classId,
    mindMethods: withArsenal.mindMethods.map((m, i) => {
      if (i === 0)
        return { ...m, name: lockedName, stacks: m.stacks || (lockedName ? "tier 6" : "") }
      if (m.name && (!allowed.has(m.name) || m.name === lockedName))
        return { ...m, name: "", stacks: "" }
      return m
    }) as Inputs["mindMethods"],
    martialArtsTalents: talents,
  }
}
