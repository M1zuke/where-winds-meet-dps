import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { BUFF } from "../skills/buffs/ids"
import { MARTIAL_ART_ID } from "./ids"
import icon from "./icons/bellstrike-umbra.png"

export const strategicSword = defineMartialArt({
  id: MARTIAL_ART_ID.strategicSword,
  name: "Strategic Sword",
  weaponType: "Sword",
  drawnWeapon: "Sword",
  additionalAttackBuffId: BUFF.strategicSwordAdditionalAttack,
  icon,
})
