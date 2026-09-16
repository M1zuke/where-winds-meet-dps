import { describe, expect, it } from "vitest"
import type { RotationDef } from "../../src/definitions/rotations/rotationDef"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"
import { ROTATIONS } from "../../src/data/rotations"

const ROTATION_MODULES = import.meta.glob<RotationDef>("../../src/data/classes/*/rotations/*.ts", {
  eager: true,
  import: "default",
})

function classIdOfFolder(modulePath: string): string {
  const folder = modulePath.split("/classes/")[1].split("/")[0]
  return folder.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

describe("built-in rotation modules", () => {
  it("each module declares the class whose folder holds it", () => {
    const misplaced = Object.entries(ROTATION_MODULES)
      .filter(([path, rotation]) => rotation.classId !== classIdOfFolder(path))
      .map(([path, rotation]) => `${path} declares ${rotation.classId}`)
    expect(misplaced).toEqual([])
  })

  it("every rotation id is unique across the whole pool", () => {
    const ids = ROTATIONS.map((rotation) => rotation.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("a defined rotation is offered by its class without being listed anywhere", () => {
    for (const classDef of CLASS_DEFS()) {
      const declared = ROTATIONS.filter((rotation) => rotation.classId === classDef.id)
      expect(classDef.rotations.map((rotation) => rotation.id)).toEqual(
        declared.map((rotation) => rotation.id),
      )
    }
  })

  it("every registered class carries at least one rotation and defaults to one of its own", () => {
    for (const classDef of CLASS_DEFS()) {
      expect(classDef.rotations.map((rotation) => rotation.id)).toContain(
        classDef.defaultRotationId,
      )
    }
  })
})
