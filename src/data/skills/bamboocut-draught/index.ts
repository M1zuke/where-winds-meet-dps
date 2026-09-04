import type { Skill } from "../../../engine/skill"
import { lightAttack } from "./light-attack"
import { falconsPursuit } from "./falcons-pursuit"
import { falconsPursuitPerfect } from "./falcons-pursuit-perfect"
import { whaledraft } from "./whaledraft"
import { whaledraftCancel } from "./whaledraft-cancel"
import { quickDrink } from "./quick-drink"
import { nightwickPrimepick } from "./nightwick-primepick"
import { nightwickPrimepickFollowUp } from "./nightwick-primepick-follow-up"
import { nightwickTipsylay } from "./nightwick-tipsylay"
import { nightwickGrounddrift } from "./nightwick-grounddrift"
import { peakfall } from "./peakfall"
import { peakfallPrepull } from "./peakfall-prepull"
import { castlink } from "./castlink"
import { dragonquenchInebriate } from "./dragonquench-inebriate"
import { dragonquenchInebriateCancel } from "./dragonquench-inebriate-cancel"
import { herosBlood } from "./heros-blood"
import { herosBloodInebriate } from "./heros-blood-inebriate"
import { reveldrift } from "./reveldrift"
import { realmplay } from "./realmplay"
import { boundvessel } from "./boundvessel"
import { skystrikeGauntletsEx } from "./skystrike-gauntlets-ex"

export const CLASS_ID = "bamboocutDraught"

export const SKILLS: Skill[] = [
  lightAttack,
  falconsPursuit,
  falconsPursuitPerfect,
  whaledraft,
  whaledraftCancel,
  quickDrink,
  nightwickPrimepick,
  nightwickPrimepickFollowUp,
  nightwickTipsylay,
  nightwickGrounddrift,
  peakfall,
  peakfallPrepull,
  castlink,
  dragonquenchInebriate,
  dragonquenchInebriateCancel,
  herosBlood,
  herosBloodInebriate,
  reveldrift,
  realmplay,
  boundvessel,
  skystrikeGauntletsEx,
]
