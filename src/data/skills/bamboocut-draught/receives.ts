import { BUFF } from "../buffs/ids"

export const CLASS_RECEIVES = [
  BUFF.inebriateCritDamage,
  BUFF.inebriateDamageScaling,
  BUFF.eonpourInebriateDamage,
  BUFF.clashToastDamage,
]

export const INEBRIATE_ENHANCED_RECEIVES = [
  ...CLASS_RECEIVES,
  BUFF.inebriateSkillCritDamage,
  BUFF.drunkslayEcho,
  BUFF.volutefitWineboundDamage,
  BUFF.tiltrimStack,
]
