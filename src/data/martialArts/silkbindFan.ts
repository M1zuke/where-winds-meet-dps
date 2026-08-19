import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { MARTIAL_ART_ID } from "./ids"
import icon from "./icons/silkbind-jade.png"

export const silkbindFan = defineMartialArt({
  id: MARTIAL_ART_ID.silkbindFan,
  name: "Silkbind Fan",
  weaponType: "Fan",
  icon,
})
