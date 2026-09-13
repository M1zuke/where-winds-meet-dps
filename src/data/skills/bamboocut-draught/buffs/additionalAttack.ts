import {
  ADDITIONAL_ATTACK_RANKS_WITH_BAMBOOCUT_EXTENSION,
  additionalAttackClassBuff,
} from "../../buffs/additionalAttackRanks"
import { BUFF } from "../../buffs/ids"

export const skystrikeGauntletsAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.skystrikeGauntletsAdditionalAttack,
  name: "Skystrike Gauntlets — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +50% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS_WITH_BAMBOOCUT_EXTENSION,
  clause: "main",
})

export const rivenTwinbladesAdditionalAttack = additionalAttackClassBuff({
  id: BUFF.rivenTwinbladesAdditionalAttack,
  name: "Riven Twinblades — Additional Attack Up",
  summary: "physFixed/attributeFixed +7.25% to +50% by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS_WITH_BAMBOOCUT_EXTENSION,
  clause: "main",
})

export const skystrikeGauntletsAdditionalAttackCoefficient = additionalAttackClassBuff({
  id: BUFF.skystrikeGauntletsAdditionalAttackCoefficient,
  name: "Skystrike Gauntlets — Falcon's Pursuit Coefficient",
  summary: "Falcon's Pursuit ×1.00725 to ×1.05 by breakthrough",
  ladder: ADDITIONAL_ATTACK_RANKS_WITH_BAMBOOCUT_EXTENSION,
  clause: "coefficient",
})
