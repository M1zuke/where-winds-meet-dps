import { BUFF } from "../buffs/ids"

export const EVERSPRING_UMBRELLA_RECEIVES = [BUFF.everspringUmbrellaAdditionalAttack]

export const UNFETTERED_ROPE_DART_RECEIVES = [BUFF.unfetteredRopeDartAdditionalAttack]

export const THROW_RECEIVES = [
  BUFF.returningUmbrellaDamage,
  BUFF.fragrantSong,
  ...EVERSPRING_UMBRELLA_RECEIVES,
]

export const PIERCING_DART_RECEIVES = [
  BUFF.battleAnthemChargedDamage,
  BUFF.battleAnthemEnduranceBoost,
  ...UNFETTERED_ROPE_DART_RECEIVES,
]
