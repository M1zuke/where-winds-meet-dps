import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { BUFF } from "../skills/buffs/ids"
import { MARTIAL_ART_ID } from "./ids"
import icon from "./icons/bamboocut-draught.png"

export const skystrikeGauntlets = defineMartialArt({
  id: MARTIAL_ART_ID.skystrikeGauntlets,
  name: "Skystrike Gauntlets",
  weaponType: "Gauntlets",
  drawnWeapon: "Gauntlets",
  additionalAttackBuffId: BUFF.skystrikeGauntletsAdditionalAttack,
  icon,
})
