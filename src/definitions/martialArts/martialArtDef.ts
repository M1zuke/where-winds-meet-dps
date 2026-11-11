import type { WeaponName } from "../../engine/types"

export interface MartialArtDef {
  id: string
  name: string
  weaponType: WeaponName
  drawnWeapon: string
  additionalAttackBuffId: string
  icon?: string
}

export function defineMartialArt<const T extends MartialArtDef>(def: T): T {
  return def
}
