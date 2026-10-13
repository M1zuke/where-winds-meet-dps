import type { Skill } from "../../../engine/skill"
import { burnAndBury } from "./burn-and-bury"
import { cycloneWaltz } from "./cyclone-waltz"
import { cycloneWaltzFinish, cycloneWaltzRecastFormFinish } from "./cyclone-waltz-finish"
import { cycloneWaltzRecast } from "./cyclone-waltz-recast"
import { cycloneWaltzRecastForm } from "./cyclone-waltz-recast-form"
import { deflectCancel } from "./deflect-cancel"
import { dreamwroughtBubbles } from "./dreamwrought-bubbles"
import { dreamwroughtBubblesInstant } from "./dreamwrought-bubbles-instant"
import { heavyAttack1 } from "./heavy-attack-1"
import { heavyAttack2 } from "./heavy-attack-2"
import { heavyAttack3 } from "./heavy-attack-3"
import { heavyAttack4 } from "./heavy-attack-4"
import { perfectCatchAfterFirst } from "./perfect-catch-after-first"
import { perfectCatchAfterSecond } from "./perfect-catch-after-second"
import { perfectCatchAfterThird } from "./perfect-catch-after-third"
import { piercingDartChargingStance } from "./piercing-dart-charging-stance"
import { piercingDartI } from "./piercing-dart-i"
import { piercingDartII, piercingDartIISweeps4To5 } from "./piercing-dart-ii"
import {
  piercingDartIII,
  piercingDartIIISweeps4To5,
  piercingDartIIISweeps6To7,
} from "./piercing-dart-iii"
import { resonance } from "./resonance"
import { resonanceDreamwrought } from "./resonance-dreamwrought"
import { ropeDash } from "./rope-dash"
import { ropeDual } from "./rope-dual"
import { ropeLightAttack } from "./rope-light-attack"
import { ropeSprintAttack } from "./rope-sprint-attack"
import { scarletSpin } from "./scarlet-spin"
import { scarletSpinFourth } from "./scarlet-spin-fourth"
import { scarletSpinSecond } from "./scarlet-spin-second"
import { scarletSpinThird } from "./scarlet-spin-third"
import { soulSweep } from "./soul-sweep"
import { springAway } from "./spring-away"
import { springAwayLift } from "./spring-away-lift"
import { umbrellaDash } from "./umbrella-dash"
import { umbrellaDashBullet } from "./umbrella-dash-bullet"
import { umbrellaDual } from "./umbrella-dual"
import { umbrellaLightAttack } from "./umbrella-light-attack"

export const CLASS_ID = "bamboocutDust"

export const SKILLS: Skill[] = [
  scarletSpin,
  scarletSpinSecond,
  scarletSpinThird,
  scarletSpinFourth,
  perfectCatchAfterFirst,
  perfectCatchAfterSecond,
  perfectCatchAfterThird,
  resonance,
  resonanceDreamwrought,
  dreamwroughtBubbles,
  dreamwroughtBubblesInstant,
  cycloneWaltz,
  cycloneWaltzFinish,
  cycloneWaltzRecastForm,
  cycloneWaltzRecastFormFinish,
  cycloneWaltzRecast,
  heavyAttack1,
  heavyAttack2,
  heavyAttack3,
  heavyAttack4,
  umbrellaLightAttack,
  springAway,
  springAwayLift,
  umbrellaDash,
  umbrellaDashBullet,
  umbrellaDual,
  deflectCancel,
  soulSweep,
  piercingDartChargingStance,
  piercingDartI,
  piercingDartII,
  piercingDartIISweeps4To5,
  piercingDartIII,
  piercingDartIIISweeps4To5,
  piercingDartIIISweeps6To7,
  burnAndBury,
  ropeLightAttack,
  ropeSprintAttack,
  ropeDash,
  ropeDual,
]
