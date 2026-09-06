import type { Skill } from "../../../engine/skill"
import { lightAttack } from "./light-attack"
import { falconsPursuit } from "./falcons-pursuit"
import { whaledraft } from "./whaledraft"
import { quickDrink } from "./quick-drink"
import { quickDrinkCancel } from "./quick-drink-cancel"
import { nightwickPrimepick } from "./nightwick-primepick"
import { nightwickPrimepickFollowUp } from "./nightwick-primepick-follow-up"
import { nightwickPrimepickFollowUpCancel } from "./nightwick-primepick-follow-up-cancel"
import { nightwickTipsylay } from "./nightwick-tipsylay"
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
import { skystrikeGauntletsEx } from "./skystrike-gauntlets-ex"
import { deflectCancel } from "./deflect-cancel"

export const CLASS_ID = "bamboocutDraught"

export const SKILLS: Skill[] = [
  lightAttack,
  falconsPursuit,
  whaledraft,
  quickDrink,
  quickDrinkCancel,
  nightwickPrimepick,
  nightwickPrimepickFollowUp,
  nightwickPrimepickFollowUpCancel,
  nightwickTipsylay,
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
  skystrikeGauntletsEx,
  deflectCancel,
]
