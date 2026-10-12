import { BUFF } from "../buffs/ids"

export const EVERSPRING_UMBRELLA_RECEIVES = [BUFF.everspringUmbrellaAdditionalAttack]

export const THROW_RECEIVES = [
  BUFF.returningUmbrellaDamage,
  BUFF.fragrantSong,
  ...EVERSPRING_UMBRELLA_RECEIVES,
]
