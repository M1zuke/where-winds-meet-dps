import type { Skill } from "../../../engine/skill"
import { fanq } from "./fanq"
import { fanqcancel } from "./fanqcancel"
import { fanqPrepull } from "./fanq-prepull"
import { fanLightCharged } from "./fanlightcharged"
import { fanSpecial } from "./fanspecial"
import { fanHeavyPursuit3Hit } from "./fanheavypursuit-3-hit"
import { umbq } from "./umbq"
import { umbqPrepull } from "./umbq-prepull"
import { umbLightCharge } from "./umblightcharge"
import { umbHeavyLight } from "./umb-heavylight"
import { umbDroneLaunch26Hit } from "./umbdronelaunch-26hit"
import { healerBuff } from "./healer-buff"
import { springSorrow } from "./spring-sorrow"
import { letSpringGo } from "./let-spring-go"
import { everbloom } from "./everbloom"
import { umbrellaLight } from "./umbrella-light"
import { springAway } from "./spring-away"

export const CLASS_ID = "silkbindJade"

export const SKILLS: Skill[] = [
  fanq,
  fanqcancel,
  fanqPrepull,
  fanLightCharged,
  fanSpecial,
  fanHeavyPursuit3Hit,
  umbq,
  umbqPrepull,
  umbLightCharge,
  umbHeavyLight,
  umbDroneLaunch26Hit,
  healerBuff,
  springSorrow,
  letSpringGo,
  everbloom,
  umbrellaLight,
  springAway,
]
