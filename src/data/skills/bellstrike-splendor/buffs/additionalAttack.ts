import {
  ADDITIONAL_ATTACK_RANKS,
  additionalAttackClassBuff,
} from "../../buffs/additionalAttackRanks"
import { BUFF } from "../../buffs/ids"

export const namelessSwordAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.namelessSwordAdditionalAttack,
  name: "Nameless Sword — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +30% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "main",
})

export const namelessSpearAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.namelessSpearAdditionalAttack,
  name: "Nameless Spear — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +30% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "main",
})
