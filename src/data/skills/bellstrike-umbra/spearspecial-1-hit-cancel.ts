import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SPEARSPECIAL_HITS } from "./spearspecial-hits"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { SWEEP_ALL_COST, SWEEP_ALL_REQUIRES } from "./buffs/enduranceGates"

// The cancel form's own interrupt window opens 2 frames later under River
// Flow than plain — in-game animation, 2026-09-24. A cast-length override
// only belongs on this form's own copy of the hit, never the shared one the
// full form also plays.
const CANCEL_HITS = [
  SPEARSPECIAL_HITS[0],
  {
    ...SPEARSPECIAL_HITS[1],
    variants: SPEARSPECIAL_HITS[1].variants?.map((variant) =>
      variant.id === "hv-spearspecial-hit-1-river-flow" ? { ...variant, castFrames: 19 } : variant,
    ),
  },
]

export const spearspecial1HitCancel = defineSkill({
  id: SKILL.spearspecial1HitCancel,
  classId: "bellstrikeUmbra",
  name: "Spear Special (1 Hit Cancel)",
  breakdownName: "Sweep All",
  tags: [WEAPON.spear, ATTUNE.spearSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearSpecial1HitCancel,
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  castConditions: [SWEEP_ALL_REQUIRES],
  meterCosts: [SWEEP_ALL_COST],
  // A cancel form ends where the animation opens its interrupt window — 17 frames in (in-game animation, 2026-09-24); the parry that ends it is the next rotation step.
  castFrames: 17,
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
  hits: CANCEL_HITS,
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
