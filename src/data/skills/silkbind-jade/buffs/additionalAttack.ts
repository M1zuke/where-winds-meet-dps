import {
  ADDITIONAL_ATTACK_RANKS,
  additionalAttackClassBuff,
} from "../../buffs/additionalAttackRanks"
import { BUFF } from "../../buffs/ids"

export const inkwellFanAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.inkwellFanAdditionalAttack,
  name: "Inkwell Fan — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +30% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "main",
})

export const vernalUmbrellaAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.vernalUmbrellaAdditionalAttack,
  name: "Vernal Umbrella — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +30% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "main",
})
