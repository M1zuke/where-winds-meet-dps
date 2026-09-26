import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { SWORDSPECIAL_HITS } from "./swordspecial-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

export const swordspecial3Hit = defineSkill({
  id: SKILL.swordspecial3Hit,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 3-Hit",
  breakdownName: "Inner Balance Strike III",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial3Hit,
  receives: STRATEGIC_SWORD_RECEIVES,
  // A player-ended form: castFrames sits 11 frames past the frame at which the animation would accept the next input (in-game animation, 2026-09-09).
  castFrames: 57,
  triggerable: true,
  hits: [
    {
      ...SWORDSPECIAL_HITS[0]!,
      // In-game cast length as of 2026-09-24: Sword Horizon cuts the
      // animation short into the Crisscross - Inner Balance III follow-up.
      variants: [
        {
          id: "hv-swordspecial-3-hit-hit-0-sword-horizon",
          label: "Sword Horizon",
          conditions: [{ param: PARAM.swordHorizon }],
          physMultiplier: SWORDSPECIAL_HITS[0]!.physMultiplier,
          attributeMultiplier: SWORDSPECIAL_HITS[0]!.attributeMultiplier,
          physFixed: SWORDSPECIAL_HITS[0]!.physFixed,
          attributeFixed: SWORDSPECIAL_HITS[0]!.attributeFixed,
          castFrames: 64,
        },
      ],
    },
    SWORDSPECIAL_HITS[1]!,
    SWORDSPECIAL_HITS[2]!,
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
