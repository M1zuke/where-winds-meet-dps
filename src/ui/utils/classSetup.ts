import type { Inputs } from "../../engine/types"
import { allowedInnerWaysForClass, defaultArsenalForClass, swapArsenal } from "../../engine/panel"
import {
  soleGraduationBuildId,
  standardizedInnerWaysForClass,
  standardizedMindMethods,
} from "../../engine/graduation"
import { slotInnerWayId } from "../../definitions/innerWays/registry"
import { getDefaultTalentsForClass } from "../../definitions/baseStats"

// On a switch to another class, or a profile with no inner ways at all, the
// class's standard inner ways fill the empty slots, skipping any it already
// carries — never a slot still holding one the class allows, so this never
// overwrites a choice the player made. A class with no standardized list leaves empty slots empty
// (docs/MIGRATIONS.md — no migration: only creation and class switches call
// this, never a stored profile on load).
export function syncClassPermanent(inputs: Inputs, classId: string): Inputs {
  const sameClass = inputs.classId === classId
  const talents =
    sameClass && inputs.martialArtsTalents.length > 0
      ? inputs.martialArtsTalents
      : getDefaultTalentsForClass(classId, inputs.breakthrough)
  const withArsenal = swapArsenal(inputs, defaultArsenalForClass(classId))
  const allowed = new Set(allowedInnerWaysForClass(classId))
  const kept = new Set<string>()
  const filteredMindMethods = withArsenal.mindMethods.map((slot) => {
    const innerWayId = slotInnerWayId(slot)
    if (!innerWayId || !allowed.has(innerWayId) || kept.has(innerWayId)) {
      return { name: "", stacks: "" }
    }
    kept.add(innerWayId)
    return slot
  }) as Inputs["mindMethods"]
  const slotsAreEmpty = filteredMindMethods.every((slot) => !slotInnerWayId(slot))
  const standardInnerWays =
    !sameClass || slotsAreEmpty ? standardizedInnerWaysForClass(classId) : null
  const standardSlots = standardInnerWays
    ? standardizedMindMethods(standardInnerWays).filter((slot) => {
        const innerWayId = slotInnerWayId(slot)
        return innerWayId && !kept.has(innerWayId)
      })
    : []
  const mindMethods = filteredMindMethods.map((slot) =>
    slotInnerWayId(slot) ? slot : (standardSlots.shift() ?? slot),
  ) as Inputs["mindMethods"]
  return {
    ...withArsenal,
    classId,
    mindMethods,
    martialArtsTalents: talents,
    graduationBuildId:
      sameClass && inputs.graduationBuildId
        ? inputs.graduationBuildId
        : soleGraduationBuildId(classId),
  }
}
