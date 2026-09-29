import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"
import { enduranceCost, enduranceRequires } from "../../resources/enduranceMeter"

// In-game values as of 2026-09-29: blocked while a Mountain's Might Endless
// Gale (from Qiankun's Lock's own end) already holds.
const legionCrusherEndlessGaleGrant = applyBuff({
  target: BUFF.endlessGaleAtStart,
  condition: { buffId: BUFF.endlessGale, op: "lte", stacks: 0 },
})

const legionCrusherWushuangStanceGrant = applyBuff({ target: BUFF.wushuangStance })

export const legionCrusher = defineSkill({
  id: SKILL.legionCrusher,
  classId: "bellstrikeSplendor",
  name: "Legion Crusher",
  tags: [WEAPON.spear, ATTUNE.spearSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.legionCrusher,
  receives: [...NAMELESS_SPEAR_RECEIVES],
  // In-game values as of 2026-09-24: needs 40, spends 40 at the cast's own
  // start.
  castConditions: [enduranceRequires("gte", 40)],
  meterCosts: [enduranceCost(40)],
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 42,
  triggerable: true,
  // In-game values as of 2026-09-28: 5.5 m approach reach; the cast's own
  // segment then steps toward the target a further short distance (4 m or
  // 1 m, by live distance) — approximated at the smaller, closer-range value
  // since it changes no damage on this single-hit cast.
  reachMeters: 5.5,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [legionCrusherEndlessGaleGrant],
    }),
    hit(1, {
      // In-game values as of 2026-09-24: the collider's own frame.
      frame: 20,
      physMultiplier: 0.91971,
      attributeMultiplier: 1.379565,
      physFixed: 255,
      attributeFixed: 139,
      triggers: [legionCrusherWushuangStanceGrant],
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
