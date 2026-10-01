import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"
import { reveldriftHits } from "./reveldrift"

// A cancel form ends where the animation opens its interrupt window — 21
// frames in (in-game animation, 2026-09-24); the parry that ends it is the
// next rotation step.
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
  cancelledBy: "deflectCancel",
  receives: [BUFF.starweaveMartialBoost, ...CLASS_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  triggersBuffs: [BUFF.jadeware],
  triggerable: false,
  castFrames: 21,
  // In-game values as of 2026-09-28: 18 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 18,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [reveldriftHits[0]],
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
