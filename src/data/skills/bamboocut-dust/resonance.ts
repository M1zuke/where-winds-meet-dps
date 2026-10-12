import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../buffs/ids"
import { ATTUNE, CAST, ROLE, WEAPON } from "../ids"
import { PHANTOM_CHIME_MIN_TIER } from "./debuffs"
import { DEBUFF, SKILL } from "./ids"
import { MARTIAL_ART_SKILL_RECEIVES, RESONANCE_RECEIVES } from "./receives"

// In-game values as of 2026-10-12: half of a shared resonance row, no flat
// damage.
export const RESONANCE_HIT = {
  physMultiplier: 0.54,
  attributeMultiplier: 0.81,
  physFixed: 0,
  attributeFixed: 0,
}

export const phantomChimeTriggers = () => [
  applyDebuff({
    target: DEBUFF.phantomChime,
    requiresParam: PARAM.phantomRally,
    requiresMinTier: PHANTOM_CHIME_MIN_TIER,
  }),
]

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
  receives: [
    BUFF.returningUmbrellaDamage,
    BUFF.fragrantSong,
    ...MARTIAL_ART_SKILL_RECEIVES,
    ...RESONANCE_RECEIVES,
  ],
  castFrames: 0,
  triggerable: true,
  hits: [hit(0, { frame: 0, ...RESONANCE_HIT, triggers: phantomChimeTriggers() })],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
