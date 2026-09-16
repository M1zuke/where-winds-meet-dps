import type { GraduationBuild } from "../../definitions/graduationBuilds/graduationBuildDef"

const GRADUATION_BUILD_MODULES = import.meta.glob<GraduationBuild>(
  "../classes/*/graduationBuilds/*.ts",
  { eager: true, import: "default" },
)

export const GRADUATION_BUILDS: readonly GraduationBuild[] = Object.values(GRADUATION_BUILD_MODULES)
