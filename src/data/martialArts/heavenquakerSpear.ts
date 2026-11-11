import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { BUFF } from "../skills/buffs/ids"
import { MARTIAL_ART_ID } from "./ids"
import icon from "./icons/bellstrike-umbra.png"

export const heavenquakerSpear = defineMartialArt({
  id: MARTIAL_ART_ID.heavenquakerSpear,
  name: "Heavenquaker Spear",
  weaponType: "Spear",
  drawnWeapon: "Spear",
  additionalAttackBuffId: BUFF.heavenquakerSpearAdditionalAttack,
  icon,
})
