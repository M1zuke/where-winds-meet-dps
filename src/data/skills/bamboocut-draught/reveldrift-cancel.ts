import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES } from "./receives"
import { reveldriftHits } from "./reveldrift"

// A cancel form ends one frame after its last landed collider; the parry that
// ends it is the next rotation step.
export const reveldriftCancel = defineSkill({
  id: SKILL.reveldriftCancel,
  classId: "bamboocutDraught",
  name: "Twinblade Q [1-hit cancel]",
  breakdownName: "Reveldrift",
  tags: [WEAPON.twinBlades, ATTUNE.twinbladesMartialArt, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.reveldriftCancel,
  receives: CLASS_RECEIVES,
  triggersBuffs: [BUFF.jadeware],
  triggerable: false,
  castFrames: 20,
  hits: [reveldriftHits[0]],
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
