import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { mistwillow } from "../../sets/mistwillow"

// "4 Pieces: Landing a Heavy Attack/Heavy Attack Pursuit Skill increases the
// Physical and Silkbind damage of Light Attacks and Ballistic Skills by 10%
// for 15 seconds, and vice versa. When both damage bonuses exist at the same
// time, they will be upgraded to Mistwillow: increases the Physical and
// Silkbind damage of both Light Attack/Ballistic Skills and Heavy Attack/Heavy
// Attack Pursuit Skills. Hitting the enemy with corresponding skills again can
// refresh the effect's duration. The duration of the effects above can only be
// refreshed once every 2 seconds." (in-game set tooltip, 18 Aug 2026).
//
// Granting, the 2-second refresh throttle (read off `cooldown` here) and the
// both-stances upgrade live in `buffEngine.ts` (`processMistwillowBuffGrant`):
// the def schema cannot express one buff replacing two others.
export const MISTWILLOW_BONUS = 0.1

export const mistwillowBuff = defineBuff({
  id: BUFF.mistwillowBuff,
  name: "Mistwillow",
  requires: { set: mistwillow.siteKey },
  duration: 15,
  cooldown: 2,
  effects: [stat("physBoost", MISTWILLOW_BONUS), stat("attributeDamageBoost", MISTWILLOW_BONUS)],
})
