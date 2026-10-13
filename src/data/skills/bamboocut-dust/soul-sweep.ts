import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, meterDelta } from "../../../definitions/skills/triggers"
import { tokensOfGratitudeMeter } from "../../classes/bamboocut-dust/meters"
import { BUFF, PARAM } from "../buffs/ids"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { STATUS, SKILL } from "./ids"
import { SOUL_SWEEP_RECEIVES } from "./receives"
import { soulSweepHitTriggers } from "./soulbreakTriggers"

const TOWLINE_SWEEP_TOKENS = 50

const OPENING_SWEEP = {
  physMultiplier: 0.94284,
  attributeMultiplier: 1.41426,
  physFixed: 261,
  attributeFixed: 142.2,
}

const FOLLOWING_SWEEP = {
  physMultiplier: 1.09998,
  attributeMultiplier: 1.64997,
  physFixed: 304.5,
  attributeFixed: 165.9,
}

// In-game values as of 2026-10-13.
export const soulSweep = defineSkill({
  id: SKILL.soulSweep,
  classId: "bamboocutDust",
  name: "Soul Sweep",
  tags: [
    WEAPON.ropeDart,
    ROLE.dustMartialArtSkill,
    PROP.isMartialSkillQ,
    ATTUNE.unfetteredMartialArt,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustSoulSweep,
  receives: SOUL_SWEEP_RECEIVES,
  triggersBuffs: [BUFF.jadeware, BUFF.springThunder],
  castFrames: 105,
  triggerable: false,
  hits: [
    hit(0, {
      frame: 9,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({ target: STATUS.soulbound }),
        meterDelta({
          target: tokensOfGratitudeMeter.id,
          stacks: TOWLINE_SWEEP_TOKENS,
          requiresParam: PARAM.towlineSweep,
        }),
      ],
    }),
    hit(1, { frame: 17, ...OPENING_SWEEP, triggers: soulSweepHitTriggers() }),
    hit(2, { frame: 54, ...FOLLOWING_SWEEP, triggers: soulSweepHitTriggers() }),
    hit(3, { frame: 76, ...FOLLOWING_SWEEP, triggers: soulSweepHitTriggers() }),
    hit(4, {
      frame: 93,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [applyBuff({ target: STATUS.piercingDartReady })],
    }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
