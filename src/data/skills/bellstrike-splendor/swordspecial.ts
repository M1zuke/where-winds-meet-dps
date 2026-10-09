import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { energySurgeCooldownCut } from "./buffs/energySurgeGrant"
import { multiWaveWindowGrantFromCastStart } from "./buffs/multiWaveWindowGrant"
import { shadowStepDashWindowGrantFromFrame } from "./buffs/shadowStepDashWindow"
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
  // In-game values as of 2026-09-28: 12.8 m reach on its own companion
  // projectile, plus a further 1 m shrink-only pull once in range.
  reachMeters: 12.8,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      // In-game values as of 2026-09-24: the bolt launches at 17.24 f and
      // lands after its own flight time, ≈ 23 f at melee range.
      frame: 23,
      physMultiplier: 1.76747,
      attributeMultiplier: 2.651205,
      physFixed: 490,
      attributeFixed: 267,
      triggers: [
        multiWaveWindowGrantFromCastStart(23),
        shadowStepDashWindowGrantFromFrame(23),
        energySurgeCooldownCut,
      ],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
})
