import type { Arsenal, BowSet, GearPiece } from "../../engine/types"

export interface GraduationBuild {
  id: string
  name: string
  classId: string
  gear: readonly GearPiece[]
  set: string | null
  bowSet: BowSet
  arsenal: Arsenal
  rotationId: string
  relayedOverrides?: Partial<Pick<GraduationBuild, "gear" | "set" | "bowSet" | "arsenal">>
}

export function defineGraduationBuild(build: GraduationBuild): GraduationBuild {
  return build
}
