import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { BUFF } from "../buffs/ids"
import { CAST, WEAPON } from "../ids"
import { DEBUFF, SKILL } from "./ids"
import { UNFETTERED_ROPE_DART_RECEIVES } from "./receives"
import { burnAndBuryRankSixTriggers } from "./soulbreakTriggers"

// In-game values as of 2026-10-12: a training stake is a boss, so the boss
// ratios apply — 0.78 of the base row against Soul Loss alone, 1.3 against
// Soulbreak.
const SOUL_LOSS_TARGET_HIT = {
  physMultiplier: 1.379212,
  attributeMultiplier: 2.068817,
  physFixed: 382.2,
  attributeFixed: 208.26,
}

const SOULBREAK_TARGET_HIT = {
  physMultiplier: 2.298686,
  attributeMultiplier: 3.448029,
  physFixed: 637,
  attributeFixed: 347.1,
}

export const burnAndBury = defineSkill({
  id: SKILL.burnAndBury,
  classId: "bamboocutDust",
  name: "Burn and Bury",
  tags: [WEAPON.ropeDart],
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustBurnAndBury,
  receives: [...UNFETTERED_ROPE_DART_RECEIVES, BUFF.towlineSweepBurnAndBury],
  castFrames: 39,
  triggerable: false,
  reachMeters: 16.5,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 32,
      ...SOUL_LOSS_TARGET_HIT,
      conditions: [
        {
          anyOf: [
            { buffId: DEBUFF.soulbreak, op: "gte", stacks: 1 },
            { buffId: DEBUFF.soulLoss, op: "gte", stacks: 1 },
          ],
        },
      ],
      variants: [
        {
          id: "soulbreak-target",
          label: "Soulbreak",
          conditions: [{ buffId: DEBUFF.soulbreak, op: "gte", stacks: 1 }],
          ...SOULBREAK_TARGET_HIT,
        },
      ],
      triggers: burnAndBuryRankSixTriggers(),
    }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
