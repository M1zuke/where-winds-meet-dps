import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, ROLE, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"
import {
  ZENITH_DETONATION_BUFF_ID,
  ZENITH_MAX_EXTENDED_DURATION_FRAMES,
  ZENITH_SMOLDER_EXTEND_FRAMES,
} from "../../innerWays/swordHorizonZenith"

export const bleedDetonation = defineSkill({
  id: SKILL.bleedDetonation,
  classId: "bellstrikeUmbra",
  name: "Bleed Detonation",
  tags: [WEAPON.sword, ATTUNE.bleed, ROLE.bleedDetonation],
  skillType: "sustain",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.bleedDetonation,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 2.4,
      attributeMultiplier: 3.6,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyDebuff({
          id: "tg-bleed-detonation-zenith-dark-fire-h0",
          target: DEBUFF.darkFire,
          stacks: 0,
          condition: { buffId: ZENITH_DETONATION_BUFF_ID, op: "gte", stacks: 1 },
          extendFrames: ZENITH_SMOLDER_EXTEND_FRAMES,
          extendOnly: true,
          maxExtendedDurationFrames: ZENITH_MAX_EXTENDED_DURATION_FRAMES,
        }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
