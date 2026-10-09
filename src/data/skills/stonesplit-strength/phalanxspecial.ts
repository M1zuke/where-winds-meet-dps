import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"
import {
  bladeMomentumMeter,
  bladeMomentumRequires,
} from "../../classes/stonesplit-strength/bladeMomentumMeter"

export const phalanxspecial = defineSkill({
  id: SKILL.phalanxspecial,
  classId: "stonesplitStrength",
  name: "PhalanxSpecial",
  tags: [WEAPON.moBlade],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.phalanxSpecial,
  receives: PHALANXBANE_BLADE_RECEIVES,
  triggersBuffs: [BUFF.ironGuards],
  // In-game values as of 2026-09-28: granted 60 f into the cast, not at its start.
  triggersBuffsAtFrame: { [BUFF.ironGuards]: 60 },
  castConditions: [bladeMomentumRequires("gte", 50)],
  meterCosts: [{ meterId: bladeMomentumMeter.id, amount: 50 }],
  castFrames: 71,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
