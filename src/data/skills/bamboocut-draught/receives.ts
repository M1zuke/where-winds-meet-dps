import { BUFF } from "../buffs/ids"

export const CLASS_RECEIVES = [
  BUFF.inebriateCritDamage,
  BUFF.eonpourInebriateDamage,
  BUFF.mistwingPhysicalPenetration,
  BUFF.mistwingAllTypePenetration,
  BUFF.mistwingInebriatePenetration,
]

export const INEBRIATE_ENHANCED_RECEIVES = [
  ...CLASS_RECEIVES,
  BUFF.inebriateSkillCritDamage,
  BUFF.drunkslayEcho,
  BUFF.volutefitWineboundDamage,
  BUFF.tiltrimInebriateBonus,
]
