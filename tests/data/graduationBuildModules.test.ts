import { describe, expect, it } from "vitest"
import type { GraduationBuild } from "../../src/definitions/graduationBuilds/graduationBuildDef"
import { CLASS_DEFS, classDefinition } from "../../src/definitions/classes/registry"
import { GRADUATION_BUILDS } from "../../src/data/graduationBuilds"

const GRADUATION_BUILD_MODULE_LOADERS = import.meta.glob<GraduationBuild>(
  "../../src/data/classes/*/graduationBuilds/*.ts",
  { import: "default" },
)

function classIdOfFolder(modulePath: string): string {
  const folder = modulePath.split("/classes/")[1].split("/")[0]
  return folder.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

describe("graduation build modules", () => {
  it("each module declares the class whose folder holds it", async () => {
    const misplaced: string[] = []
    for (const [path, loadBuild] of Object.entries(GRADUATION_BUILD_MODULE_LOADERS)) {
      const build = await loadBuild()
      if (build.classId !== classIdOfFolder(path))
        misplaced.push(`${path} declares ${build.classId}`)
    }
    expect(misplaced).toEqual([])
  })

  it("every graduation build id is unique across every class", () => {
    const ids = GRADUATION_BUILDS.map((build) => build.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every graduation build carries a name", () => {
    expect(GRADUATION_BUILDS.filter((build) => !build.name.trim())).toEqual([])
  })

  it("a defined graduation build is offered by its class without being listed anywhere", () => {
    for (const classDef of CLASS_DEFS()) {
      const declared = GRADUATION_BUILDS.filter((build) => build.classId === classDef.id)
      expect(classDefinition(classDef.id)!.graduationBuilds.map((build) => build.id)).toEqual(
        declared.map((build) => build.id),
      )
    }
  })
})
