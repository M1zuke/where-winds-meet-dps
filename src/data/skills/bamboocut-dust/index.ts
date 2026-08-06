import type { Skill } from "../../../engine/skill"
import ropeCharge13Hit from "./rope-charge-1-3-hit.json"
import ropeCharge45Hit from "./rope-charge-4-5-hit.json"
import ropeSpecial from "./rope-special.json"
import umbrellaQ from "./umbrella-q.json"
import umbrellaQPerfectCatch from "./umbrella-q-perfect-catch.json"
import umbrellaQEmpoweredPerfectCatch from "./umbrella-q-empowered-perfect-catch.json"
import ropeQ from "./rope-q.json"
import resonance from "./resonance.json"
import firstResonance from "./first-resonance.json"
import ropeQ1Hit from "./rope-q-1-hit.json"
import ropeCharge67Hit from "./rope-charge-6-7-hit.json"
import soulbreakPop from "./soulbreak-pop.json"

export const CLASS_ID = "bamboocutDust"

export const SKILLS = [
  ropeCharge13Hit,
  ropeCharge45Hit,
  ropeSpecial,
  umbrellaQ,
  umbrellaQPerfectCatch,
  umbrellaQEmpoweredPerfectCatch,
  ropeQ,
  resonance,
  firstResonance,
  ropeQ1Hit,
  ropeCharge67Hit,
  soulbreakPop,
] as unknown as Skill[]
