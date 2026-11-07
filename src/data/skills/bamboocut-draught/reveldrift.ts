import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff } from "../../../definitions/skills/triggers"
import type { TriggerCondition } from "../../../engine/skill"
import {
  reveldriftChargeAvailable,
  reveldriftChargeCost,
} from "../../classes/bamboocut-draught/chargeMeters"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"

// In-game values as of 2026-10-15.
export const reveldriftHits = [
  hit(0, {
    frame: 20,
    physMultiplier: 0.2640125,
    attributeMultiplier: 0.39601875,
    physFixed: 73.25,
    attributeFixed: 40,
    triggers: [applyDebuff({ target: DEBUFF.strayhunt, stacks: 1 })],
  }),
  hit(1, {
    frame: 24,
    physMultiplier: 0.2640125,
    attributeMultiplier: 0.39601875,
    physFixed: 73.25,
    attributeFixed: 40,
  }),
]

export const reveldriftSpacingHit = hit(2, {
  frame: 0,
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
  triggers: [applyBuff({ target: STATUS.reveldriftSpacing, stacks: 1 })],
})

export const REVELDRIFT_CAST_CONDITIONS: TriggerCondition[] = [
  reveldriftChargeAvailable,
  { buffId: STATUS.reveldriftSpacing, op: "eq", stacks: 0 },
]

// Cast length: in-game animation, 2026-09-05.
export const reveldrift = defineSkill({
  id: SKILL.reveldrift,
  classId: "bamboocutDraught",
  name: "Twinblade Q",
  breakdownName: "Reveldrift",
  tags: [WEAPON.twinBlades, ATTUNE.twinbladesMartialArt, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.reveldrift,
  receives: [BUFF.starweaveMartialBoost, ...CLASS_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  triggersBuffs: [BUFF.jadeware],
  castConditions: REVELDRIFT_CAST_CONDITIONS,
  meterCosts: [reveldriftChargeCost],
  triggerable: false,
  castFrames: 66,
  // In-game values as of 2026-09-28: 18 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 18,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [...reveldriftHits, reveldriftSpacingHit],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
