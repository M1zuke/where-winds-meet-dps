import type { InnerWayId } from "../../data/innerWays/ids"
import type { Arsenal, BowSet, CombatSettings, GearPiece, Inputs } from "../../engine/types"

export interface StandardizedInnerWay {
  id: InnerWayId
  tier: number
}

export const BEST_AVAILABLE_FOOD = "bestAvailable"

export type StandardizedEncounter = Pick<
  Inputs,
  | "dummyMode"
  | "hpFood"
  | "divinecraft"
  | "divinecraftRefinement"
  | "shareDebuff5HenZhi"
  | "shareEasyHurt"
> &
  CombatSettings & { food: Inputs["food"] | typeof BEST_AVAILABLE_FOOD }

export interface StandardizedGraduation {
  encounter?: Partial<StandardizedEncounter>
  innerWays: readonly StandardizedInnerWay[]
}

export const STANDARDIZED_ENCOUNTER_OFF: StandardizedEncounter = {
  dummyMode: false,
  food: null,
  hpFood: null,
  divinecraft: null,
  divinecraftRefinement: null,
  shareDebuff5HenZhi: false,
  shareEasyHurt: false,
  script: null,
  dragonsBreath: false,
  healerBuff: false,
  healerPanaceaFan: false,
  breakExtension: false,
  dragonHeadFullStacks: false,
  dragonHeadLowHpMaxBonus: false,
  fragrantOrchidBathBean: false,
}

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
  standardized?: StandardizedGraduation
}

export function defineGraduationBuild(build: GraduationBuild): GraduationBuild {
  return build
}
