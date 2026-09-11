import {
  ADDITIONAL_ATTACK_RANKS,
  additionalAttackClassBuff,
} from "../../buffs/additionalAttackRanks"
import { BUFF } from "../../buffs/ids"

export const phalanxbaneBladeAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.phalanxbaneBladeAdditionalAttack,
  name: "Phalanxbane Blade — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +30% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "main",
})

export const snowpartingBladeAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.snowpartingBladeAdditionalAttack,
  name: "Snowparting Blade — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +30% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "main",
})
