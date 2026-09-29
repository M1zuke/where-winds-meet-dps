import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"

// In-game values as of 2026-09-24: a hit that does not launch its target —
// always true on a training stake — opens Gourd Toss's own Thunder window
// for the next cast, at this cast's own end. Rank 3 and up.
const gourdTossThunderGrant = applyBuff({
  target: BUFF.gourdTossThunder,
  appliesOnCastEnd: true,
  requiresParam: PARAM.gourdToss,
  requiresMinTier: 3,
})

// In-game values as of 2026-09-24: opens Flying Tornado for the next
// Forsaken Fame, approximated on this cast's own end — this engine has no
// water-clone-return event of its own to key the window from. Rank 4 and up.
const gourdTossFlyingTornadoGrant = applyBuff({
  target: BUFF.gourdTossFlyingTornado,
  appliesOnCastEnd: true,
  requiresParam: PARAM.gourdToss,
  requiresMinTier: 4,
})

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
  receives: [BUFF.gourdTossThunder, ...INKWELL_FAN_RECEIVES],
  triggersBuffs: [BUFF.lingeringBone],
  // In-game values as of 2026-09-28: granted at its own hit, not at the
  // cast's start.
  triggersBuffsAtFrame: { [BUFF.lingeringBone]: 33 },
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 67,
  triggerable: true,
  // In-game values as of 2026-09-28: 9 m approach reach; the cast's own
  // segments then teleport to about 1.5 m from the target, along its facing.
  reachMeters: 9,
  displacement: { kind: "toTarget", meters: 1.5 },
  // Both halves land together (in-game animation, 2026-09-24).
  hits: [
    hit(0, { frame: 33, ...COEFFICIENTS }),
    hit(1, {
      frame: 33,
      ...COEFFICIENTS,
      triggers: [gourdTossThunderGrant, gourdTossFlyingTornadoGrant],
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
