import type { Skill } from "../../../engine/skill"
import { swordq } from "./swordq"
import { swordqfollowup } from "./swordqfollowup"
import { spearheavy } from "./spearheavy"
import { spearq } from "./spearq"
import { swordspecial3Hit } from "./swordspecial-3-hit"
import { crosswindBlade } from "./crosswind-blade"
import { spearheavy1HitPrepull } from "./spearheavy-1-hit-prepull"
import { spearq5HitCancel } from "./spearq-5-hit-cancel"
import { swordspecial4Hit } from "./swordspecial-4-hit"
import { swordChargeStage14Hit } from "./sword-charge-stage-1-4-hit"
import { swordqFollowUp1HitCancel } from "./swordq-follow-up-1-hit-cancel"
import { swordqFollowUp2HitCancel } from "./swordq-follow-up-2-hit-cancel"
import { swordMartialQqq } from "./sword-martial-qqq"
import { swordChargeStage13Hit } from "./sword-charge-stage-1-3-hit"
import { swordChargeStage15Hit } from "./sword-charge-stage-1-5-hit"
import { swordRChargeFollowUp } from "./sword-r-charge-follow-up"
import { swordRChargeFollowUp1HitCancel } from "./sword-r-charge-follow-up-1-hit-cancel"
import { spearheavy1Hit } from "./spearheavy-1-hit"
import { spearspecial1HitCancel } from "./spearspecial-1-hit-cancel"
import { spearspecial } from "./spearspecial"
import { bleedTick } from "./bleed-tick"
import { bleedDetonation } from "./bleed-detonation"
import { dragonFireSmolder1Hit } from "./dragon-fire-smolder-1-hit"
import { dragonFireSmolder2Hits } from "./dragon-fire-smolder-2-hits"

export const CLASS_ID = "bellstrikeUmbra"

export const SKILLS: Skill[] = [
  swordq,
  swordqfollowup,
  spearheavy,
  spearq,
  swordspecial3Hit,
  crosswindBlade,
  spearheavy1HitPrepull,
  spearq5HitCancel,
  swordspecial4Hit,
  swordChargeStage14Hit,
  swordqFollowUp1HitCancel,
  swordqFollowUp2HitCancel,
  swordMartialQqq,
  swordChargeStage13Hit,
  swordChargeStage15Hit,
  swordRChargeFollowUp,
  swordRChargeFollowUp1HitCancel,
  spearheavy1Hit,
  spearspecial1HitCancel,
  spearspecial,
  bleedTick,
  bleedDetonation,
  dragonFireSmolder1Hit,
  dragonFireSmolder2Hits,
]
