import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORDSPECIAL_HITS } from "./swordspecial-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import { SWORDSPECIAL_1_HIT_MOTION } from "./rootMotion"
import { INNER_BALANCE_STRIKE_III_COST, INNER_BALANCE_STRIKE_III_REQUIRES } from "./buffs/enduranceGates"

export const swordspecial1Hit = defineSkill({
  id: SKILL.swordspecial1Hit,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 1-Hit",
  breakdownName: "Inner Balance Strike III",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial1Hit,
  cancelledBy: "deflectCancel",
  receives: STRATEGIC_SWORD_RECEIVES,
  castConditions: [INNER_BALANCE_STRIKE_III_REQUIRES],
  meterCosts: [INNER_BALANCE_STRIKE_III_COST],
  // In-game values as of 2026-10-16: only a Deflect or dodge ends the cast
  // before MOVEPOST, one frame after the hit; any other follow-up waits for it.
  castFrames: 29.8,
  triggerable: true,
  displacement: SWORDSPECIAL_1_HIT_MOTION,
  hits: SWORDSPECIAL_HITS.slice(0, 1),
  createdAt: "2026-09-09T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
})
