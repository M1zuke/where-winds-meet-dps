import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { MARTIAL_ART_ID } from "./ids"
import icon from "./icons/strategic-sword.png"

export const heavenquakerSpear = defineMartialArt({
  id: MARTIAL_ART_ID.heavenquakerSpear,
  name: "Heavenquaker Spear",
  weaponType: "Spear",
  icon,
})
