import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { BUFF } from "../skills/buffs/ids"
import { MARTIAL_ART_ID } from "./ids"

export const rivenTwinblades = defineMartialArt({
  id: MARTIAL_ART_ID.rivenTwinblades,
  name: "Riven Twinblades",
  weaponType: "Twin Blades",
  drawnWeapon: "Twin Blades",
  additionalAttackBuffId: BUFF.rivenTwinbladesAdditionalAttack,
})
