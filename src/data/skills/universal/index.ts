import type { Skill } from "../../../engine/skill"
import { bitterSeasonTick } from "./bitter-season-tick"
import { deflectCancelPrepull } from "./deflect-cancel-prepull"
import { deflectCancel } from "./deflect-cancel"
import { delay } from "./delay"
import { ghostlySteps } from "./ghostly-steps"
import { goldenBodyCancel } from "./golden-body-cancel"
import { goldenBodyDeflectCancel } from "./golden-body-deflect-cancel"
import { perfectDodgeFull } from "./perfect-dodge-full"
import { perfectDodge } from "./perfect-dodge"

export const UNIVERSAL_SKILLS: Skill[] = [
  bitterSeasonTick,
  deflectCancelPrepull,
  deflectCancel,
  delay,
  ghostlySteps,
  goldenBodyCancel,
  goldenBodyDeflectCancel,
  perfectDodgeFull,
  perfectDodge,
]
