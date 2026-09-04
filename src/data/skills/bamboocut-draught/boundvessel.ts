import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import type { TriggerCondition } from "../../../engine/skill"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const INEBRIATE: TriggerCondition[] = [{ buffId: STATUS.bingePoints, op: "gte", stacks: 100 }]

const rapidSlash = (index: number) =>
  hit(index, {
    frame: -1,
    physMultiplier: 0.158668,
    attributeMultiplier: 0.238001,
    physFixed: 43.953,
    attributeFixed: 23.933,
    conditions: INEBRIATE,
  })

// Coefficients: client skill_numerical_config at skill level 100 (hotfix
// 2026-09-01) — first heavy 20503206 (0.60053 / 167 / 91), rapid slash
// 2050320701 (1.7436 / 483 / 263) at the tooltip's 0.091 per hit, finishing
// slash 20503207 (0.5772 / 161 / 87); attribute side × 1.5. Eleven rapid
// slashes fill the 1.5 s hold (11 × 0.091 ≈ 1), a provisional count. The
// completed hold grants Cloudvault (client locale text, 2026-09-04).
export const boundvessel = defineSkill({
  id: SKILL.boundvessel,
  classId: "bamboocutDraught",
  name: "Boundvessel",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.boundvessel,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage50],
  triggerable: false,
  castFrames: -1,
  hits: [
    hit(0, {
      frame: -1,
      physMultiplier: 0.60053,
      attributeMultiplier: 0.900795,
      physFixed: 167,
      attributeFixed: 91,
      conditions: INEBRIATE,
    }),
    rapidSlash(1),
    rapidSlash(2),
    rapidSlash(3),
    rapidSlash(4),
    rapidSlash(5),
    rapidSlash(6),
    rapidSlash(7),
    rapidSlash(8),
    rapidSlash(9),
    rapidSlash(10),
    rapidSlash(11),
    hit(12, {
      frame: -1,
      physMultiplier: 0.5772,
      attributeMultiplier: 0.8658,
      physFixed: 161,
      attributeFixed: 87,
      conditions: INEBRIATE,
      triggers: [applyBuff({ target: STATUS.cloudvault, stacks: 1 })],
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
