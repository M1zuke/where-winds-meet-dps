import { BUFF } from "../buffs/ids"

export const CLASS_RECEIVES = [BUFF.eonpourInebriateDamage]

export const INEBRIATE_ENHANCED_RECEIVES = [
  ...CLASS_RECEIVES,
  BUFF.inebriateSkillCritDamage,
  BUFF.drunkslayEcho,
  BUFF.volutefitWineboundDamage,
  BUFF.tiltrimInebriateBonus,
]

export const MISTWILLOW_LIGHT_ATTACK_RECEIVES = [BUFF.mistwillowHeavyBuff, BUFF.mistwillowBuff]

export const MISTWILLOW_HEAVY_ATTACK_RECEIVES = [BUFF.mistwillowLightBuff, BUFF.mistwillowBuff]

export const SKYSTRIKE_GAUNTLETS_RECEIVES = [BUFF.skystrikeGauntletsAdditionalAttack]

export const RIVEN_TWINBLADES_RECEIVES = [BUFF.rivenTwinbladesAdditionalAttack]
