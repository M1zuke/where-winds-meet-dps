import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { skillBingePointAccumulationTriggers } from "./buffs/skillBingePointAccumulation"

// On a PvE target the follow-up out of Tipsylay is always Nightwick -
// Primepick's single hit — the 3-hit Tri-strike form needs the arena-only
// Tri-Strike Mark, never held on a dummy. The Binge Points the chained drink
// converts are banked by this skill on frame 27, not by Tipsylay. In-game
// values as of 2026-10-15.
export const primepickFollowUpHits = [
  hit(0, {
    frame: 20,
    physMultiplier: 0.64565,
    attributeMultiplier: 0.968475,
    physFixed: 180,
    attributeFixed: 98,
    triggers: [applyDebuff({ target: DEBUFF.wildstride, stacks: 1 })],
  }),
  hit(1, {
    frame: 27,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    triggers: skillBingePointAccumulationTriggers,
  }),
]

// Cast length to the earliest next input: in-game animation, 2026-10-15.
export const nightwickPrimepickFollowUp = defineSkill({
  id: SKILL.nightwickPrimepickFollowUp,
  classId: "bamboocutDraught",
  name: "Gauntlet Special - Primepick Follow-up",
  breakdownName: "Nightwick - Primepick",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial, ROLE.inebriateEnhanced],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.nightwickPrimepickFollowUp,
  receives: [
    ...INEBRIATE_ENHANCED_RECEIVES,
    ...SKYSTRIKE_GAUNTLETS_RECEIVES,
    BUFF.nonPlayerBaseDamage40,
  ],
  triggerable: false,
  castFrames: 36,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: primepickFollowUpHits,
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
