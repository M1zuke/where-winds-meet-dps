import type { Skill } from "../../../engine/skill"
import { lightAttack } from "./light-attack"
import { bloombreak } from "./bloombreak"
import { falconsPursuit } from "./falcons-pursuit"
import { whaledraft } from "./whaledraft"
import { quickDrink } from "./quick-drink"
import { quickDrinkCancel } from "./quick-drink-cancel"
import { nightwickPrimepick } from "./nightwick-primepick"
import { nightwickPrimepickFollowUp } from "./nightwick-primepick-follow-up"
import { nightwickPrimepickFollowUpCancel } from "./nightwick-primepick-follow-up-cancel"
import { nightwickGrounddrift } from "./nightwick-grounddrift"
import { peakfall } from "./peakfall"
import { peakfallPrepull } from "./peakfall-prepull"
import { castlink } from "./castlink"
import { dragonquenchInebriate } from "./dragonquench-inebriate"
import { dragonquenchInebriateCancel } from "./dragonquench-inebriate-cancel"
import { dragonquenchInebriateSecond } from "./dragonquench-inebriate-second"
import { dragonquenchInebriateSecondCancel } from "./dragonquench-inebriate-second-cancel"
import { dragonquenchInebriateThird } from "./dragonquench-inebriate-third"
import { dragonquenchInebriateThirdCancel } from "./dragonquench-inebriate-third-cancel"
import { herosBlood } from "./heros-blood"
import { herosBloodInebriate } from "./heros-blood-inebriate"
import { reveldrift } from "./reveldrift"
import { reveldriftCancel } from "./reveldrift-cancel"
import { realmplay } from "./realmplay"
import { boundvessel } from "./boundvessel"
import { bladeVessel } from "./blade-vessel"
import { whaledraftTap } from "./whaledraft-tap"
import { whaledraftHold } from "./whaledraft-hold"
import { whaledraftHoldShort } from "./whaledraft-hold-short"
import { dualBladesLightAttack1 } from "./dual-blades-light-attack-1"
import { dualBladesLightAttack2 } from "./dual-blades-light-attack-2"
import { dualBladesLightAttack3 } from "./dual-blades-light-attack-3"
import { dualBladesLightAttack4 } from "./dual-blades-light-attack-4"
import { skystrikeGauntletsEx } from "./skystrike-gauntlets-ex"
import { gauntletsDual } from "./gauntlets-dual"
import { deflectCancel } from "./deflect-cancel"
import { perfectDodge } from "./perfect-dodge"
import { perfectDodgeFull } from "./perfect-dodge-full"
import { falconsPursuitTwinblades } from "./falcons-pursuit-twinblades"
import { twinbladeQuickDrink } from "./twinblade-quick-drink"
import { twinbladeQuickDrinkCancel } from "./twinblade-quick-drink-cancel"
import { boundvesselDrinkCancel } from "./boundvessel-drink-cancel"
import { bladeAgainstWaves } from "./blade-against-waves"
import { tidepour } from "./tidepour"
import { gauntletsDash } from "./gauntlets-dash"
import { gauntletsDashTipsy } from "./gauntlets-dash-tipsy"
import { twinbladesDual } from "./twinblades-dual"

export const CLASS_ID = "bamboocutDraught"

export const SKILLS: Skill[] = [
  lightAttack,
  bloombreak,
  falconsPursuit,
  whaledraft,
  quickDrink,
  quickDrinkCancel,
  nightwickPrimepick,
  nightwickPrimepickFollowUp,
  nightwickPrimepickFollowUpCancel,
  nightwickGrounddrift,
  peakfall,
  peakfallPrepull,
  castlink,
  dragonquenchInebriate,
  dragonquenchInebriateCancel,
  dragonquenchInebriateSecond,
  dragonquenchInebriateSecondCancel,
  dragonquenchInebriateThird,
  dragonquenchInebriateThirdCancel,
  herosBlood,
  herosBloodInebriate,
  reveldrift,
  reveldriftCancel,
  realmplay,
  boundvessel,
  bladeVessel,
  whaledraftTap,
  whaledraftHold,
  whaledraftHoldShort,
  dualBladesLightAttack1,
  dualBladesLightAttack2,
  dualBladesLightAttack3,
  dualBladesLightAttack4,
  skystrikeGauntletsEx,
  deflectCancel,
  perfectDodge,
  perfectDodgeFull,
  gauntletsDual,
  falconsPursuitTwinblades,
  twinbladeQuickDrink,
  twinbladeQuickDrinkCancel,
  boundvesselDrinkCancel,
  bladeAgainstWaves,
  tidepour,
  gauntletsDash,
  gauntletsDashTipsy,
  twinbladesDual,
]
