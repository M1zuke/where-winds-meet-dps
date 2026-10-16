import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { SWORDSPECIAL_HITS } from "./swordspecial-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import { INNER_BALANCE_STRIKE_III_COST, INNER_BALANCE_STRIKE_III_REQUIRES } from "./buffs/enduranceGates"

export const swordspecial3Hit = defineSkill({
  id: SKILL.swordspecial3Hit,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 3-Hit",
  breakdownName: "Inner Balance Strike III",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial3Hit,
  receives: STRATEGIC_SWORD_RECEIVES,
  // In-game values as of 2026-10-16: without Sword Horizon every follow-up waits
  // for the 84 f MOVEPOST and the 4th hit lands, so the 3-hit form exists only
  // with it, where MOVEPOST comes at 63.78 f.
  castConditions: [INNER_BALANCE_STRIKE_III_REQUIRES, { param: PARAM.swordHorizon }],
  meterCosts: [INNER_BALANCE_STRIKE_III_COST],
  castFrames: 63.78,
  triggerable: true,
  hits: SWORDSPECIAL_HITS.slice(0, 3),
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
})
