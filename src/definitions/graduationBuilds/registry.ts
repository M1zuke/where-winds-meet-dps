import { GRADUATION_BUILDS } from "../../data/graduationBuilds"
import type { GraduationBuild } from "./graduationBuildDef"

export function allGraduationBuilds(): readonly GraduationBuild[] {
  return GRADUATION_BUILDS
}

export function graduationBuildsFor(classId: string): GraduationBuild[] {
  return GRADUATION_BUILDS.filter((build) => build.classId === classId)
}
