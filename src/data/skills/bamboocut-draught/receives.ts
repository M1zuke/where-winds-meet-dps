import { BUFF } from "../buffs/ids"

export const CLASS_RECEIVES = [BUFF.eonpourInebriateDamage]

export const INEBRIATE_ENHANCED_RECEIVES = [
  ...CLASS_RECEIVES,
  BUFF.inebriateSkillCritDamage,
  BUFF.drunkslayEcho,
  BUFF.volutefitWineboundDamage,
  BUFF.tiltrimInebriateBonus,
]

export const SKYSTRIKE_GAUNTLETS_RECEIVES = [BUFF.skystrikeGauntletsAdditionalAttack]

export const RIVEN_TWINBLADES_RECEIVES = [BUFF.rivenTwinbladesAdditionalAttack]
