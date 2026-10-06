import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { mountainsMightQiImbalanceMarkerGrant } from "./buffs/qiImbalanceMarkerGrant"

// In-game values as of 2026-09-29: removed at the animation start — this
// cast only exists while its own window holds.
const relentlessChaseWindowConsume = applyBuff({ target: BUFF.relentlessChaseWindow, stacks: -1 })
const qiShieldGrant = applyBuff({ target: BUFF.qiShield, durationFrames: 180 })

export const swordq3rd = defineSkill({
  id: SKILL.swordq3rd,
  classId: "bellstrikeSplendor",
  name: "SwordQ[3rd]",
  breakdownName: "Relentless Chase",
  tags: [WEAPON.sword, ATTUNE.swordQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordQ3rd,
  startLatency: "noWaitOnDummy",
  triggersBuffs: [BUFF.jadeware, BUFF.mountainsMightQiImbalance],
  receives: [BUFF.starweaveMartialBoost, ...NAMELESS_SWORD_RECEIVES],
  // Only offered while Relentless Chase's first strike opened this window
  // (docs/TIMELINE.md § "Cast legality").
  castConditions: [{ buffId: BUFF.relentlessChaseWindow, op: "gte", stacks: 1 }],
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 84,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach.
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [relentlessChaseWindowConsume],
    }),
    hit(1, {
      frame: 19,
      physMultiplier: 0.768985,
      attributeMultiplier: 1.153478,
      physFixed: 212.7,
      attributeFixed: 115.95,
    }),
    hit(2, {
      frame: 34,
      physMultiplier: 0.768985,
      attributeMultiplier: 1.153478,
      physFixed: 212.7,
      attributeFixed: 115.95,
    }),
    hit(3, {
      frame: 64,
      physMultiplier: 1.025314,
      attributeMultiplier: 1.537971,
      physFixed: 283.6,
      attributeFixed: 154.6,
      triggers: [mountainsMightQiImbalanceMarkerGrant],
    }),
    hit(4, {
      // In-game values as of 2026-09-24: the Qi Shield is granted 60 f into
      // the cast.
      frame: 60,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [qiShieldGrant],
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
