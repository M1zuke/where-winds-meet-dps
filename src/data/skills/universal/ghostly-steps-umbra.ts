import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { ghostlyStepsUmbraGrant } from "./buffs/ghostlyStepsUmbra"
import { mirageEnduranceCostReductionGrant } from "./buffs/mirageEnduranceCostReduction"

export const ghostlyStepsUmbra = defineSkill({
  id: SKILL.ghostlyStepsUmbra,
  classId: "universal",
  name: "Ghostly Steps - Umbra",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.ghostlyStepsUmbra,
  triggersBuffs: [BUFF.mirage],
  castFrames: 0,
  triggerable: true,
  reachMeters: 100,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [mirageEnduranceCostReductionGrant, ghostlyStepsUmbraGrant],
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
