import {
  ADDITIONAL_ATTACK_RANKS,
  additionalAttackClassBuff,
} from "../../buffs/additionalAttackRanks"
import { BUFF } from "../../buffs/ids"

export const everspringUmbrellaAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.everspringUmbrellaAdditionalAttack,
  name: "Everspring Umbrella — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +30% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "main",
})
