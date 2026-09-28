import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SPEARSPECIAL_HITS } from "./spearspecial-hits"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { SWEEP_ALL_COST, SWEEP_ALL_REQUIRES } from "./buffs/enduranceGates"

export const spearspecial = defineSkill({
  id: SKILL.spearspecial,
  classId: "bellstrikeUmbra",
  name: "Spear Special",
  breakdownName: "Sweep All",
  // Not a Heavy Attack for Mistwillow: in-game values as of 2026-09-24.
  tags: [WEAPON.spear, ATTUNE.spearSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearSpecial,
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  castConditions: [SWEEP_ALL_REQUIRES],
  meterCosts: [SWEEP_ALL_COST],
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 102,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach; once between 1.5
  // and 4.5 m the cast's own segment teleports 1.5 m behind the target,
  // otherwise no further scripted motion.
  reachMeters: 3,
  displacement: {
    kind: "byDistance",
    bands: [{ minMeters: 1.5, maxMeters: 4.5, then: { kind: "toTarget", meters: 1.5 } }],
    otherwise: { kind: "towardTarget", referenceMeters: 0 },
  },
  hits: SPEARSPECIAL_HITS,
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
