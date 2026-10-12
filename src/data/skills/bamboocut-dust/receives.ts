import { BUFF } from "../buffs/ids"

export const EVERSPRING_UMBRELLA_RECEIVES = [BUFF.everspringUmbrellaAdditionalAttack]

export const UNFETTERED_ROPE_DART_RECEIVES = [BUFF.unfetteredRopeDartAdditionalAttack]

export const MARTIAL_ART_SKILL_RECEIVES = [
  BUFF.starweaveMartialBoost,
  BUFF.wolfchasersArtMartialDamage,
  BUFF.tangMelodyEarlyRanks,
  BUFF.tangMelodyLaterRanks,
]

export const RESONANCE_RECEIVES = [BUFF.etherwrathPenetrationBoost, BUFF.phantomRallyResonanceBoost]

export const LIGHT_ATTACK_MARK_RECEIVES = [BUFF.mistwillowHeavyBuff, BUFF.mistwillowBuff]

export const HEAVY_ATTACK_MARK_RECEIVES = [BUFF.mistwillowLightBuff, BUFF.mistwillowBuff]

export const SPRING_THUNDER_RECEIVES = [BUFF.thunderousBloom, BUFF.springThunder]

export const UMBRELLA_LIGHT_CHAIN_RECEIVES = [
  BUFF.swallowcallLightAttackBoost,
  ...SPRING_THUNDER_RECEIVES,
  ...LIGHT_ATTACK_MARK_RECEIVES,
  ...EVERSPRING_UMBRELLA_RECEIVES,
]

export const UMBRELLA_PROJECTILE_RECEIVES = [
  ...SPRING_THUNDER_RECEIVES,
  ...LIGHT_ATTACK_MARK_RECEIVES,
  ...EVERSPRING_UMBRELLA_RECEIVES,
]

export const UMBRELLA_HEAVY_CHAIN_RECEIVES = [
  ...SPRING_THUNDER_RECEIVES,
  ...HEAVY_ATTACK_MARK_RECEIVES,
  ...EVERSPRING_UMBRELLA_RECEIVES,
]

export const ROPE_LIGHT_CHAIN_RECEIVES = [
  BUFF.swallowcallLightAttackBoost,
  ...SPRING_THUNDER_RECEIVES,
  ...LIGHT_ATTACK_MARK_RECEIVES,
  ...UNFETTERED_ROPE_DART_RECEIVES,
]

export const ROPE_SPRINT_RECEIVES = [
  ...SPRING_THUNDER_RECEIVES,
  ...LIGHT_ATTACK_MARK_RECEIVES,
  ...UNFETTERED_ROPE_DART_RECEIVES,
]

export const SOUL_SWEEP_RECEIVES = [...MARTIAL_ART_SKILL_RECEIVES, ...UNFETTERED_ROPE_DART_RECEIVES]

export const THROW_RECEIVES = [
  BUFF.returningUmbrellaDamage,
  BUFF.fragrantSong,
  ...MARTIAL_ART_SKILL_RECEIVES,
  ...EVERSPRING_UMBRELLA_RECEIVES,
]

export const PIERCING_DART_RECEIVES = [
  BUFF.battleAnthemChargedDamage,
  BUFF.battleAnthemEnduranceBoost,
  ...UNFETTERED_ROPE_DART_RECEIVES,
]
