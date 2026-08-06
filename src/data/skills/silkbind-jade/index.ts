import type { Skill } from "../../../engine/skill"
import fanqPrepull from "./fanq-prepull.json"
import umbqPrepull from "./umbq-prepull.json"
import umblightcharge from "./umblightcharge.json"
import umbdronelaunch20hit from "./umbdronelaunch-20hit.json"
import fanspecial from "./fanspecial.json"
import fanqcancel from "./fanqcancel.json"
import fanheavypursuit3Hit from "./fanheavypursuit-3-hit.json"
import umbq from "./umbq.json"
import umbHeavylight from "./umb-heavylight.json"
import fanq from "./fanq.json"
import fanlightcharged from "./fanlightcharged.json"
import fanheavypursuit5Hit from "./fanheavypursuit-5-hit.json"
import umbdronelaunch12hit from "./umbdronelaunch-12hit.json"
import umbdronelaunch26hit from "./umbdronelaunch-26hit.json"
import umbdronelaunch23hit from "./umbdronelaunch-23hit.json"
import umbdronelaunch16hit from "./umbdronelaunch-16hit.json"
import healerBuff from "./healer-buff.json"
import healerExtension from "./healer-extension.json"

export const CLASS_ID = "silkbindJade"

export const SKILLS = [
  fanqPrepull,
  umbqPrepull,
  umblightcharge,
  umbdronelaunch20hit,
  fanspecial,
  fanqcancel,
  fanheavypursuit3Hit,
  umbq,
  umbHeavylight,
  fanq,
  fanlightcharged,
  fanheavypursuit5Hit,
  umbdronelaunch12hit,
  umbdronelaunch26hit,
  umbdronelaunch23hit,
  umbdronelaunch16hit,
  healerBuff,
  healerExtension,
] as unknown as Skill[]
