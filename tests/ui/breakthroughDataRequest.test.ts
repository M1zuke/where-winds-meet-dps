import { describe, expect, it } from "vitest"
import { breakthroughDataRequestFor } from "../../src/ui/layout/breakthrough-data-dialog/breakthroughDataRequest"
import {
  BREAKTHROUGH_RELEASES,
  defaultBreakthrough,
} from "../../src/definitions/baseStats/breakthroughs"
import { CLASS_DEFS, CLASS_IDS, classDefinition } from "../../src/definitions/classes/registry"
import { INNER_WAYS } from "../../src/definitions/innerWays/registry"

const NEXT_RELEASE = BREAKTHROUGH_RELEASES[BREAKTHROUGH_RELEASES.length - 1]

// Read off the registry rather than listed here: which inner ways still carry
// pre-release figures is data that moves as captures land.
function pendingIdsFor(classId: string): readonly string[] {
  return classDefinition(classId)!.innerWays.filter((innerWayId) => {
    const innerWay = INNER_WAYS.find((candidate) => candidate.id === innerWayId)
    return !!innerWay && innerWay.confirmedBreakthrough < NEXT_RELEASE.breakthrough
  })
}

const CLASSES_WITH_PENDING_DATA = CLASS_IDS().filter((classId) => pendingIdsFor(classId).length > 0)

describe("breakthroughDataRequestFor", () => {
  it("asks for nothing while every inner way is confirmed at the live breakthrough", () => {
    for (const classId of CLASS_IDS())
      expect(breakthroughDataRequestFor(classId, NEXT_RELEASE.at - 1)).toBeNull()
  })

  it("names the class it is asking, and the breakthrough that superseded its data", () => {
    for (const classDef of CLASS_DEFS()) {
      if (pendingIdsFor(classDef.id).length === 0) continue
      const request = breakthroughDataRequestFor(classDef.id, NEXT_RELEASE.at)
      expect(request?.className).toBe(classDef.displayName)
      expect(request?.liveBreakthrough).toBe(NEXT_RELEASE.breakthrough)
    }
  })

  it("lists the inner ways the class slots whose data the release superseded, signature one first", () => {
    for (const classDef of CLASS_DEFS()) {
      const request = breakthroughDataRequestFor(classDef.id, NEXT_RELEASE.at)
      expect(request?.pendingInnerWays.map((innerWay) => innerWay.id) ?? [], classDef.id).toEqual(
        pendingIdsFor(classDef.id),
      )
    }
  })

  it("asks a class nothing once every inner way it slots is confirmed", () => {
    for (const classId of CLASS_IDS()) {
      if (pendingIdsFor(classId).length > 0) continue
      expect(breakthroughDataRequestFor(classId, NEXT_RELEASE.at), classId).toBeNull()
    }
  })

  it("carries each pending inner way's own name and stale breakthrough", () => {
    for (const classId of CLASSES_WITH_PENDING_DATA) {
      const request = breakthroughDataRequestFor(classId, NEXT_RELEASE.at)
      for (const pending of request!.pendingInnerWays) {
        const innerWay = INNER_WAYS.find((candidate) => candidate.id === pending.id)!
        expect(pending.name).toBe(innerWay.name)
        expect(pending.confirmedBreakthrough).toBe(innerWay.confirmedBreakthrough)
      }
    }
  })

  it("asks for nothing on a class id it does not know", () => {
    expect(breakthroughDataRequestFor("noSuchClass", NEXT_RELEASE.at)).toBeNull()
  })

  it("never claims a breakthrough that has not been released", () => {
    for (const innerWay of INNER_WAYS)
      expect(innerWay.confirmedBreakthrough).toBeLessThanOrEqual(defaultBreakthrough())
  })
})
