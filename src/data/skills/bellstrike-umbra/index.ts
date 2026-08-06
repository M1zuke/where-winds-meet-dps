import type { Skill } from "../../../engine/skill"
import swordq from "./swordq.json"
import swordqfollowup from "./swordqfollowup.json"
import spearheavy from "./spearheavy.json"
import spearq from "./spearq.json"
import swordspecial3Hit from "./swordspecial-3-hit.json"
import crosswindBlade from "./crosswind-blade.json"
import spearheavy1HitPrepull from "./spearheavy-1-hit-prepull.json"
import spearq5HitCancel from "./spearq-5-hit-cancel.json"
import swordspecial4Hit from "./swordspecial-4-hit.json"
import swordChargeStage14Hit from "./sword-charge-stage-1-4-hit.json"
import swordqFollowUp1HitCancel from "./swordq-follow-up-1-hit-cancel.json"
import swordqFollowUp2HitCancel from "./swordq-follow-up-2-hit-cancel.json"
import swordMartialQqq from "./sword-martial-qqq.json"
import swordChargeStage13Hit from "./sword-charge-stage-1-3-hit.json"
import swordChargeStage15Hit from "./sword-charge-stage-1-5-hit.json"
import swordRChargeFollowUp from "./sword-r-charge-follow-up.json"
import swordRChargeFollowUp1HitCancel from "./sword-r-charge-follow-up-1-hit-cancel.json"
import spearheavy1Hit from "./spearheavy-1-hit.json"
import spearspecial1HitCancel from "./spearspecial-1-hit-cancel.json"
import spearspecial from "./spearspecial.json"
import bleedTick from "./bleed-tick.json"
import bleedDetonation from "./bleed-detonation.json"
import dragonFireSmolder1Hit from "./dragon-fire-smolder-1-hit.json"
import dragonFireSmolder2Hits from "./dragon-fire-smolder-2-hits.json"

export const CLASS_ID = "bellstrikeUmbra"

export const SKILLS = [
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
] as unknown as Skill[]
