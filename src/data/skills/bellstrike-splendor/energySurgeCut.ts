import { hit } from "../../../definitions/skills/skillDef"
import { deflectCancelSkillId } from "../../../engine/deflectCancels"
import { SKILL } from "./ids"

const ENERGY_SURGE_OR_DEFLECT = [SKILL.energySurge, deflectCancelSkillId("bellstrikeSplendor")]

export const energySurgeCutHit = (index: number, frame: number, castFrames: number) =>
  hit(index, {
    frame,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    requiresNextStepSkillIds: ENERGY_SURGE_OR_DEFLECT,
    castFramesWhenGated: castFrames,
  })
