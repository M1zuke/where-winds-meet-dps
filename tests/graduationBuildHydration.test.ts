import { beforeEach, describe, expect, it } from "vitest"
import { classDefinition } from "../src/definitions/classes/registry"
import { loadProfiles } from "../src/storage"
import capturedProfileFile from "./migrations/testProfiles/v25/bellstrikeUmbra.json"

interface ProfileFile {
  v: number
  profile: { id: string; name: string; inputs: Record<string, unknown> }
}

const CAPTURED = capturedProfileFile as unknown as ProfileFile

function loadWithGraduationBuildId(graduationBuildId: unknown) {
  const inputs = { ...CAPTURED.profile.inputs }
  if (graduationBuildId === undefined) delete inputs.graduationBuildId
  else inputs.graduationBuildId = graduationBuildId
  const profile = { ...CAPTURED.profile, inputs }
  localStorage.setItem(
    "wwm.profiles",
    JSON.stringify({ v: CAPTURED.v, profiles: [profile], activeId: profile.id }),
  )
  return loadProfiles().profiles[0].inputs
}

describe("loading a saved profile — the followed graduation build", () => {
  beforeEach(() => localStorage.clear())

  it("stores a single-build class's only build on a profile saved before builds could be chosen", () => {
    const [onlyBuild] = classDefinition("bellstrikeUmbra")!.graduationBuilds

    expect(loadWithGraduationBuildId(undefined).graduationBuildId).toBe(onlyBuild.id)
  })

  it("keeps a build id written by a newer build exactly as stored", () => {
    expect(loadWithGraduationBuildId("graduation-from-a-newer-build").graduationBuildId).toBe(
      "graduation-from-a-newer-build",
    )
  })

  it("replaces another class's build with this class's only build", () => {
    const [umbraBuild] = classDefinition("bellstrikeUmbra")!.graduationBuilds
    const [otherBuild] = classDefinition("stonesplitStrength")!.graduationBuilds

    expect(loadWithGraduationBuildId(otherBuild.id).graduationBuildId).toBe(umbraBuild.id)
  })
})
