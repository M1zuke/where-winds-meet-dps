import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { BUFF } from "../buffs/ids"
import { ATTUNE, CAST, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"

// In-game values as of 2026-10-12: half of a shared resonance row, no flat
// damage.
export const RESONANCE_HIT = {
  physMultiplier: 0.54,
  attributeMultiplier: 0.81,
  physFixed: 0,
  attributeFixed: 0,
}

export const resonance = defineSkill({
  id: SKILL.resonance,
  classId: "bamboocutDust",
  name: "Resonance (Martial Art Skill)",
  breakdownName: "Resonance",
  tags: [
    WEAPON.umbrella,
    ROLE.dustMartialArtSkill,
    ROLE.dustResonance,
    ATTUNE.everspringMartialArt,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustResonance,
  receives: [BUFF.returningUmbrellaDamage, BUFF.fragrantSong],
  castFrames: 0,
  triggerable: true,
  hits: [hit(0, { frame: 0, ...RESONANCE_HIT })],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
