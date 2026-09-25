import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"

// On a PvE target the follow-up out of Tipsylay is always Nightwick -
// Primepick's single hit — the 3-hit Tri-strike form needs the arena-only
// Tri-Strike Mark, never held on a dummy. In-game values as of 2026-09-16.
export const primepickFollowUpHits = [
  hit(0, {
    frame: 20,
    physMultiplier: 0.64565,
    attributeMultiplier: 0.968475,
    physFixed: 180,
    attributeFixed: 98,
    triggers: [applyDebuff({ target: DEBUFF.wildstride, stacks: 1 })],
  }),
]

// Cast length to the earliest next input: in-game animation, 2026-09-05.
export const nightwickPrimepickFollowUp = defineSkill({
  id: SKILL.nightwickPrimepickFollowUp,
  classId: "bamboocutDraught",
  name: "Gauntlet Special - Primepick Follow-up",
  breakdownName: "Nightwick - Primepick",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial],
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
  castFrames: 102,
  hits: primepickFollowUpHits,
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
