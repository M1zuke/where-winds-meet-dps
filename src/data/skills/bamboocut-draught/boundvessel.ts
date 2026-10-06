import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import type { TriggerCondition } from "../../../engine/skill"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"
import { enduranceMeter } from "../../resources/enduranceMeter"

const INEBRIATE: TriggerCondition[] = [{ buffId: STATUS.bingePoints, op: "gte", stacks: 100 }]

const rapidSlash = (index: number, frame: number) =>
  hit(index, {
    frame,
    physMultiplier: 0.158668,
    attributeMultiplier: 0.238001,
    physFixed: 43.953,
    attributeFixed: 23.933,
    conditions: INEBRIATE,
  })

// Coefficients at skill level 100 (in-game damage tooltip, 2026-09-04): the
// press splits its 0.60053 / 167 / 91 total into two hits of 0.5 each; rapid
// slash 1.7436 / 483 / 263 at 0.091 per hit; the two finishing slashes split
// 0.2 and 0.4 of 0.5772 / 161 / 87; attribute side × 1.5. The hold is 11
// slashes, spread evenly across the loop window (in-game values as of
// 2026-10-06). The completed hold grants Cloudvault (in-game skill text,
// 2026-09-04); cast length and the finishing hit frames to the full hold's own
// finish: in-game animation, 2026-09-24.
export const boundvessel = defineSkill({
  id: SKILL.boundvessel,
  classId: "bamboocutDraught",
  name: "Twinblade Heavy Attack",
  breakdownName: "Boundvessel",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.boundvessel,
  receives: [
    ...INEBRIATE_ENHANCED_RECEIVES,
    ...RIVEN_TWINBLADES_RECEIVES,
    BUFF.nonPlayerBaseDamage50,
  ],
  triggerable: false,
  castFrames: 208,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  // The rapid-slash loop's own Endurance drain, 1.6 s from its start
  // (in-game values as of 2026-09-24).
  meterDrains: [{ meterId: enduranceMeter.id, perSecond: 15, fromFrame: 40, stopAfterSec: 1.6 }],
  hits: [
    hit(0, {
      frame: 24,
      physMultiplier: 0.300265,
      attributeMultiplier: 0.4503975,
      physFixed: 83.5,
      attributeFixed: 45.5,
      conditions: INEBRIATE,
    }),
    hit(14, {
      frame: 24,
      physMultiplier: 0.300265,
      attributeMultiplier: 0.4503975,
      physFixed: 83.5,
      attributeFixed: 45.5,
      conditions: INEBRIATE,
    }),
    rapidSlash(1, 47),
    rapidSlash(2, 56),
    rapidSlash(3, 65),
    rapidSlash(4, 74),
    rapidSlash(5, 83),
    rapidSlash(6, 91),
    rapidSlash(7, 100),
    rapidSlash(8, 109),
    rapidSlash(9, 118),
    rapidSlash(10, 127),
    rapidSlash(11, 135),
    hit(12, {
      frame: 144,
      physMultiplier: 0.11544,
      attributeMultiplier: 0.17316,
      physFixed: 32.2,
      attributeFixed: 17.4,
      conditions: INEBRIATE,
    }),
    hit(13, {
      frame: 161,
      physMultiplier: 0.23088,
      attributeMultiplier: 0.34632,
      physFixed: 64.4,
      attributeFixed: 34.8,
      conditions: INEBRIATE,
      triggers: [applyBuff({ target: STATUS.cloudvault, stacks: 1 })],
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
