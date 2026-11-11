import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { BUFF } from "../skills/buffs/ids"
import { MARTIAL_ART_ID } from "./ids"
import icon from "./icons/bellstrike-splendor.png"

export const namelessSpear = defineMartialArt({
  id: MARTIAL_ART_ID.namelessSpear,
  name: "Nameless Spear",
  weaponType: "Spear",
  drawnWeapon: "Spear",
  additionalAttackBuffId: BUFF.namelessSpearAdditionalAttack,
  icon,
})
