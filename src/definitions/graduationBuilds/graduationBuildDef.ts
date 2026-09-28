import type { InnerWayId } from "../../data/innerWays/ids"
import {
  defaultCombatSettings,
  type Arsenal,
  type BowSet,
  type CombatSettings,
  type GearPiece,
  type Inputs,
} from "../../engine/types"

export interface StandardizedInnerWay {
  id: InnerWayId
  tier: number
}

export type StandardizedEncounter = Pick<
  Inputs,
  | "dummyMode"
  | "food"
  | "divinecraft"
  | "shareDebuff5HenZhi"
  | "shareEasyHurt"
  | "pingMs"
  | "averageFps"
> &
  Omit<CombatSettings, "qiBreakOverride">

export interface StandardizedGraduation {
  encounter?: Partial<StandardizedEncounter>
  innerWays: readonly StandardizedInnerWay[]
}

export const STANDARDIZED_ENCOUNTER_OFF: StandardizedEncounter = {
  dummyMode: false,
  food: false,
  divinecraft: null,
  shareDebuff5HenZhi: false,
  shareEasyHurt: false,
  pingMs: 0,
  averageFps: 60,
  script: null,
  dragonsBreath: false,
  healerBuff: false,
  healerPanaceaFan: false,
  breakExtension: false,
  dragonHeadFullStacks: false,
  dragonHeadLowHpMaxBonus: false,
  preferredDistanceMeters: defaultCombatSettings().preferredDistanceMeters,
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
