import {
  ADDITIONAL_ATTACK_RANKS,
  additionalAttackClassBuff,
} from "../../buffs/additionalAttackRanks"
import { BUFF } from "../../buffs/ids"

export const strategicSwordAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.strategicSwordAdditionalAttack,
  name: "Strategic Sword — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +30% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "main",
})

export const heavenquakerSpearAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.heavenquakerSpearAdditionalAttack,
  name: "Heavenquaker Spear — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +30% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "main",
})

export const strategicSwordAdditionalAttackCoefficient = additionalAttackClassBuff({
  id: BUFF.bellstrikeUmbraBleedCoefficient,
  name: "Strategic Sword — Bleed Power Coefficient",
  summary: "Bleeding and Blood Burst ×1.00725 to ×1.03 by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS,
  clause: "coefficient",
})
