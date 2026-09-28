import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { multiWaveWindowBootstrapTrigger } from "./buffs/multiWaveWindowGrant"
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
  castFrames: 24,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.767,
      attributeMultiplier: 2.6505,
      physFixed: 490,
      attributeFixed: 267,
      triggers: [multiWaveWindowBootstrapTrigger],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
