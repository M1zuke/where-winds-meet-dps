import type { Skill } from "../../../engine/skill"
import { umbdronelaunch, umbdroneTick } from "./umbdronelaunch"
import { fanheavypursuit3Hit } from "./fanheavypursuit-3-hit"
import { fanheavypursuit5Hit } from "./fanheavypursuit-5-hit"
import { fanlightcharged } from "./fanlightcharged"
import { fanqPrepull } from "./fanq-prepull"
import { fanq } from "./fanq"
import { fanqcancel } from "./fanqcancel"
import { fanspecial } from "./fanspecial"
import { healerBuff } from "./healer-buff"
import { healerExtension } from "./healer-extension"
import { umbHeavylight } from "./umb-heavylight"
import { umbHeavylightHeavyShare } from "./umb-heavylight-heavyshare"
import { umbdrone12HitTick } from "./umbdrone-12hit"
import { umbdrone16HitTick } from "./umbdrone-16hit"
import { umbdrone20HitTick } from "./umbdrone-20hit"
import { umbdrone23HitTick } from "./umbdrone-23hit"
import { umbdrone26HitTick } from "./umbdrone-26hit"
import { umbdronelaunch12Hit } from "./umbdronelaunch-12hit"
import { umbdronelaunch16Hit } from "./umbdronelaunch-16hit"
import { umbdronelaunch20Hit } from "./umbdronelaunch-20hit"
import { umbdronelaunch23Hit } from "./umbdronelaunch-23hit"
import { umbdronelaunch26Hit } from "./umbdronelaunch-26hit"
import { umblightcharge } from "./umblightcharge"
import { umblightchargeLift } from "./umblightcharge-lift"
import { apricotHeavenNormal } from "./apricot-heaven-normal"
import { apricotHeavenEnhanced } from "./apricot-heaven-enhanced"
import { glowAndFlowStage1 } from "./glow-and-flow-stage-1"
import { glowAndFlowStage2 } from "./glow-and-flow-stage-2"
import { bambooBreeze } from "./bamboo-breeze"
import { hiddenSwordLight1 } from "./hidden-sword-light-1"
import { hiddenSwordLight2 } from "./hidden-sword-light-2"
import { hiddenSwordLight3 } from "./hidden-sword-light-3"
import { hiddenSwordLight4 } from "./hidden-sword-light-4"
import { hiddenSwordLight5 } from "./hidden-sword-light-5"
import { hiddenSwordHeavy1 } from "./hidden-sword-heavy-1"
import { hiddenSwordHeavy2 } from "./hidden-sword-heavy-2"
import { hiddenSwordHeavy3 } from "./hidden-sword-heavy-3"
import { hiddenSwordHeavyAlt } from "./hidden-sword-heavy-alt"
import { umbqPrepull } from "./umbq-prepull"
import { umbq } from "./umbq"
import { deflectCancel } from "./deflect-cancel"

export const CLASS_ID = "silkbindJade"

export const SKILLS: Skill[] = [
  umbdronelaunch,
  umbdroneTick,
  fanheavypursuit3Hit,
  fanheavypursuit5Hit,
  fanlightcharged,
  fanqPrepull,
  fanq,
  fanqcancel,
  fanspecial,
  healerBuff,
  healerExtension,
  umbHeavylight,
  umbHeavylightHeavyShare,
  umbdrone12HitTick,
  umbdrone16HitTick,
  umbdrone20HitTick,
  umbdrone23HitTick,
  umbdrone26HitTick,
  umbdronelaunch12Hit,
  umbdronelaunch16Hit,
  umbdronelaunch20Hit,
  umbdronelaunch23Hit,
  umbdronelaunch26Hit,
  umblightcharge,
  umblightchargeLift,
  apricotHeavenNormal,
  apricotHeavenEnhanced,
  glowAndFlowStage1,
  glowAndFlowStage2,
  bambooBreeze,
  hiddenSwordLight1,
  hiddenSwordLight2,
  hiddenSwordLight3,
  hiddenSwordLight4,
  hiddenSwordLight5,
  hiddenSwordHeavy1,
  hiddenSwordHeavy2,
  hiddenSwordHeavy3,
  hiddenSwordHeavyAlt,
  umbqPrepull,
  umbq,
  deflectCancel,
]
