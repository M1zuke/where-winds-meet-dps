import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { shadowStepDashWindowConsume } from "./buffs/shadowStepDashWindow"
import { enduranceCost, enduranceRequires } from "../../resources/enduranceMeter"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06: castable while Shadow Step's window holds;
// needs 10 Endurance, spends 15 at the cast's own start.
export const swordSpecialDash = defineSkill({
  id: SKILL.swordSpecialDash,
  classId: "bellstrikeSplendor",
  name: "SwordSpecial Dash",
  breakdownName: "Sword - Dash",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecialDash,
  receives: NAMELESS_SWORD_RECEIVES,
  castConditions: [
    enduranceRequires("gte", 10),
    { buffId: BUFF.shadowStepDashWindow, op: "gte", stacks: 1 },
  ],
  meterCosts: [enduranceCost(15)],
  castFrames: 46,
  triggerable: true,
  reachMeters: 6.5,
  displacement: { kind: "toTarget", meters: 1.5 },
  hits: [
    hit(0, {
      frame: 28,
      ...levelScaled(LEVEL_ROWS.swordspecialDashHit0),
      triggers: [shadowStepDashWindowConsume],
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
