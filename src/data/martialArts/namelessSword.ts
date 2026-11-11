import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { BUFF } from "../skills/buffs/ids"
import { MARTIAL_ART_ID } from "./ids"
import icon from "./icons/bellstrike-splendor.png"

export const namelessSword = defineMartialArt({
  id: MARTIAL_ART_ID.namelessSword,
  name: "Nameless Sword",
  weaponType: "Sword",
  drawnWeapon: "Sword",
  additionalAttackBuffId: BUFF.namelessSwordAdditionalAttack,
  icon,
})
