import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { mountainsMightQiImbalanceMarkerGrant } from "./buffs/qiImbalanceMarkerGrant"
import { energySurgeCutHit } from "./energySurgeCut"

// In-game values as of 2026-10-15: granted 0.01 s after the cast starts, 6 s,
// unlocking Relentless Chase's second strike in the Q slot.
const relentlessChaseWindowGrant = applyBuff({
  target: BUFF.relentlessChaseWindow,
  durationFrames: 360,
})

export const swordq2nd = defineSkill({
  id: SKILL.swordq2nd,
  classId: "bellstrikeSplendor",
  name: "SwordQ[2nd]",
  breakdownName: "Relentless Chase",
  tags: [WEAPON.sword, ATTUNE.swordQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordQ2nd,
  triggersBuffs: [BUFF.jadeware],
  receives: [
    BUFF.starweaveMartialBoost,
    BUFF.mountainsMightQiImbalance,
    ...NAMELESS_SWORD_RECEIVES,
  ],
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 60,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach.
  reachMeters: 3,
  // Two slashes of 0.15 each, not Daunting Strike's own single 0.2 (in-game
  // animation, 2026-09-24).
  hits: [
    hit(0, {
      frame: 7,
      physMultiplier: 0.768985,
      attributeMultiplier: 1.153478,
      physFixed: 212.7,
      attributeFixed: 115.95,
      triggers: [mountainsMightQiImbalanceMarkerGrant],
    }),
    hit(1, {
      frame: 48,
      physMultiplier: 0.768985,
      attributeMultiplier: 1.153478,
      physFixed: 212.7,
      attributeFixed: 115.95,
      triggers: [mountainsMightQiImbalanceMarkerGrant],
    }),
    energySurgeCutHit(2, 49, 50),
    hit(3, {
      frame: 1,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [relentlessChaseWindowGrant],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
