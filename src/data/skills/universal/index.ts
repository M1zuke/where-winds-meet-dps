import type { Skill } from "../../../engine/skill"
import { bitterSeasonTick } from "./bitter-season-tick"
import { deflectCancelPrepull } from "./deflect-cancel-prepull"
import { deflectCancel } from "./deflect-cancel"
import { delay } from "./delay"
import { dragonHeadPlus } from "./dragon-head-plus"
import { dragonHead } from "./dragon-head"
import { drunkenpoetPrepull } from "./drunkenpoet-prepull"
import { fireBreath1HitPrepull } from "./fire-breath-1-hit-prepull"
import { fireBreath1Hit } from "./fire-breath-1-hit"
import { fireBreath2Hit } from "./fire-breath-2-hit"
import { fluteOfTheTidesCancel } from "./flute-of-the-tides-cancel"
import { fluteOfTheTidesFull } from "./flute-of-the-tides-full"
import { fluteOfTheTidesPrepull } from "./flute-of-the-tides-prepull"
import { ghostlySteps } from "./ghostly-steps"
import { goldenBodyCancel } from "./golden-body-cancel"
import { goldenBodyDeflectCancel } from "./golden-body-deflect-cancel"
import { perfectDodgeFull } from "./perfect-dodge-full"
import { perfectDodge } from "./perfect-dodge"
import { poetFinalHitCancel } from "./poet-final-hit-cancel"
import { poet1 } from "./poet1"
import { poet2 } from "./poet2"
import { poet3 } from "./poet3"
import { poet4 } from "./poet4"
import { soaring1Hit } from "./soaring-1-hit"
import { soaring } from "./soaring"
import { toadCancel } from "./toad-cancel"

export const UNIVERSAL_SKILLS: Skill[] = [
  bitterSeasonTick,
  deflectCancelPrepull,
  deflectCancel,
  delay,
  dragonHeadPlus,
  dragonHead,
  drunkenpoetPrepull,
  fireBreath1HitPrepull,
  fireBreath1Hit,
  fireBreath2Hit,
  fluteOfTheTidesCancel,
  fluteOfTheTidesFull,
  fluteOfTheTidesPrepull,
  ghostlySteps,
  goldenBodyCancel,
  goldenBodyDeflectCancel,
  perfectDodgeFull,
  perfectDodge,
  poetFinalHitCancel,
  poet1,
  poet2,
  poet3,
  poet4,
  soaring1Hit,
  soaring,
  toadCancel,
]
