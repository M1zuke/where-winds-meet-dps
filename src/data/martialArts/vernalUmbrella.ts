import { defineMartialArt } from "../../definitions/martialArts/martialArtDef"
import { BUFF } from "../skills/buffs/ids"
import { MARTIAL_ART_ID } from "./ids"
import icon from "./icons/silkbind-jade.png"

export const vernalUmbrella = defineMartialArt({
  id: MARTIAL_ART_ID.vernalUmbrella,
  name: "Vernal Umbrella",
  weaponType: "Umbrella",
  drawnWeapon: "Umbrella",
  additionalAttackBuffId: BUFF.vernalUmbrellaAdditionalAttack,
  icon,
})
