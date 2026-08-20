import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// The authored value is the whole cast spread over its hits, not a per-hit
// value — the reference def states it per hit. Kept as total ÷ hits so the
// number the source actually carries stays legible.
const CAST_HITS = 2
const CAST_TOTAL = {
  physMultiplier: 1.2798,
  attributeMultiplier: 1.9197,
  physFixed: 355,
  attributeFixed: 193,
}

const COEFFICIENTS = {
  physMultiplier: CAST_TOTAL.physMultiplier / CAST_HITS,
  attributeMultiplier: CAST_TOTAL.attributeMultiplier / CAST_HITS,
  physFixed: CAST_TOTAL.physFixed / CAST_HITS,
  attributeFixed: CAST_TOTAL.attributeFixed / CAST_HITS,
  extraCritDamage: 0,
}

export const fanspecial = defineSkill({
  id: SKILL.fanspecial,
  classId: "silkbindJade",
  name: "FanSpecial",
  tags: [WEAPON.fan, ATTUNE.fanSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanSpecial,
  triggersBuffs: [BUFF.lingeringBone],
  castFrames: 72,
  triggerable: true,
  hits: [hit(0, { frame: 0, ...COEFFICIENTS }), hit(1, { frame: 36, ...COEFFICIENTS })],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
