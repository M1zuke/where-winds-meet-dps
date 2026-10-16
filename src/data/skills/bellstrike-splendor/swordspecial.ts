import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { SHADOW_STEP_MOTION } from "./rootMotion"
import { energySurgeCooldownCut } from "./buffs/energySurgeGrant"
import { multiWaveWindowGrantFromCastStart } from "./buffs/multiWaveWindowGrant"
import { shadowStepDashWindowGrantFromFrame } from "./buffs/shadowStepDashWindow"
import { SHADOW_STEP_PROJECTILE } from "./flyingSwordProjectiles"
import { enduranceCost, enduranceRequires } from "../../resources/enduranceMeter"

export const swordSpecial = defineSkill({
  id: SKILL.swordSpecial,
  classId: "bellstrikeSplendor",
  name: "SwordSpecial",
  breakdownName: "Shadow Step",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial,
  triggersBuffs: [BUFF.swordSlashDamageBoost],
  receives: [
    BUFF.swordSlashDamageBoost,
    BUFF.swordEnergyEnhancement,
    BUFF.swordEnergyHpDamage,
    ...NAMELESS_SWORD_RECEIVES,
  ],
  // In-game values as of 2026-09-26: needs 30, spends 25 at the cast's own
  // start.
  castConditions: [enduranceRequires("gte", 30)],
  meterCosts: [enduranceCost(25)],
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 44,
  triggerable: true,
  // In-game values as of 2026-09-28: 12.8 m reach on its own companion projectile.
  reachMeters: 12.8,
  displacement: SHADOW_STEP_MOTION,
  hits: [
    hit(0, {
      // In-game values as of 2026-10-15: the bolt launches at 17.06 f.
      frame: 17.06,
      projectile: SHADOW_STEP_PROJECTILE,
      physMultiplier: 1.76747,
      attributeMultiplier: 2.651205,
      physFixed: 490,
      attributeFixed: 267,
      triggers: [energySurgeCooldownCut],
    }),
    hit(1, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [multiWaveWindowGrantFromCastStart(0)],
    }),
    hit(2, {
      // In-game values as of 2026-10-15: the Sword - Dash window opens with
      // the 17.24 f keyframe.
      frame: 17.24,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [shadowStepDashWindowGrantFromFrame(17.24)],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
