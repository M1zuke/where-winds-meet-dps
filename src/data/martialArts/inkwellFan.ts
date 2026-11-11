import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { BUFF } from "../skills/buffs/ids"
import { MARTIAL_ART_ID } from "./ids"
import icon from "./icons/silkbind-jade.png"

export const inkwellFan = defineMartialArt({
  id: MARTIAL_ART_ID.inkwellFan,
  name: "Inkwell Fan",
  weaponType: "Fan",
  drawnWeapon: "Fan",
  additionalAttackBuffId: BUFF.inkwellFanAdditionalAttack,
  icon,
})
