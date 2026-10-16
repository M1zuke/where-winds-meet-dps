import { defineSkill } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { SWORDSPECIAL_HITS } from "./swordspecial-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import { SWORDSPECIAL_4_HIT_MOTION } from "./rootMotion"
import { INNER_BALANCE_STRIKE_III_COST, INNER_BALANCE_STRIKE_III_REQUIRES } from "./buffs/enduranceGates"

// In-game values as of 2026-09-24: the Special attunement reaches hits 1–3
// only — the 4th hit is `swordspecial-4-hit-final.ts`'s own skill.
export const swordspecial4Hit = defineSkill({
  id: SKILL.swordspecial4Hit,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 4-Hit",
  breakdownName: "Inner Balance Strike III",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial4Hit,
  receives: STRATEGIC_SWORD_RECEIVES,
  castConditions: [INNER_BALANCE_STRIKE_III_REQUIRES],
  meterCosts: [INNER_BALANCE_STRIKE_III_COST],
  // In-game values as of 2026-10-16: every follow-up waits for MOVEPOST at
  // 84 f; with Sword Horizon MOVEPOST is already reached at 63.78 f, so a
  // follow-up pressed after the 4th hit starts one frame after it.
  castFrames: 84,
  triggerable: true,
  displacement: SWORDSPECIAL_4_HIT_MOTION,
  hits: [
    {
      ...SWORDSPECIAL_HITS[0]!,
      variants: [
        {
          id: "hv-swordspecial-4-hit-hit-0-sword-horizon",
          label: "Sword Horizon",
          conditions: [{ param: PARAM.swordHorizon }],
          physMultiplier: SWORDSPECIAL_HITS[0]!.physMultiplier,
          attributeMultiplier: SWORDSPECIAL_HITS[0]!.attributeMultiplier,
          physFixed: SWORDSPECIAL_HITS[0]!.physFixed,
          attributeFixed: SWORDSPECIAL_HITS[0]!.attributeFixed,
          castFrames: 76.96,
        },
      ],
    },
    SWORDSPECIAL_HITS[1]!,
    {
      ...SWORDSPECIAL_HITS[2]!,
      triggers: [...SWORDSPECIAL_HITS[2]!.triggers, castSkill({ target: SKILL.swordspecial4HitFinal })],
    },
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
})
