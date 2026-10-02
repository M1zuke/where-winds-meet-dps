import type { Inputs } from "../../engine/types"
import { allowedInnerWaysForClass, defaultArsenalForClass, swapArsenal } from "../../engine/panel"
import {
  soleGraduationBuildId,
  standardizedInnerWaysForClass,
  standardizedMindMethods,
} from "../../engine/graduation"
import { slotInnerWayId } from "../../definitions/innerWays/registry"
import { getDefaultTalentsForClass } from "../../definitions/baseStats"

// A class's standard inner ways fill a profile's empty slots — never a slot
// still carrying one the new class allows, so this never overwrites a choice
// the player made. A class with no standardized list leaves empty slots empty
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
  const standardInnerWays = slotsAreEmpty ? standardizedInnerWaysForClass(classId) : null
  return {
    ...withArsenal,
    classId,
    mindMethods: standardInnerWays
      ? standardizedMindMethods(standardInnerWays)
      : filteredMindMethods,
    martialArtsTalents: talents,
    graduationBuildId:
      sameClass && inputs.graduationBuildId
        ? inputs.graduationBuildId
        : soleGraduationBuildId(classId),
  }
}
