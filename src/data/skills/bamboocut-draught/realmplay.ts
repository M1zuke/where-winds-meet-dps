import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"

// The airborne follow-up of Reveldrift. Coefficients: the in-game level-100
// row (0.804 / 223 / 122, 2026-09-04) splits into two hits of 0.5 each;
// attribute side × 1.5. Cast length and hit frame: in-game animation,
// 2026-09-05.
export const realmplay = defineSkill({
  id: SKILL.realmplay,
  classId: "bamboocutDraught",
  name: "Realmplay",
  tags: [WEAPON.twinBlades, ATTUNE.twinbladesMartialArt, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.realmplay,
  receives: [BUFF.starweaveMartialBoost, ...CLASS_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  triggersBuffs: [BUFF.jadeware],
  triggerable: false,
  castFrames: 28,
  // In-game values as of 2026-09-28: 18 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 18,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 10,
      physMultiplier: 0.402,
      attributeMultiplier: 0.603,
      physFixed: 111.5,
      attributeFixed: 61,
      triggers: [applyDebuff({ target: DEBUFF.strayhunt, stacks: 1 })],
    }),
    hit(1, {
      frame: 10,
      physMultiplier: 0.402,
      attributeMultiplier: 0.603,
      physFixed: 111.5,
      attributeFixed: 61,
      triggers: [applyDebuff({ target: DEBUFF.strayhunt, stacks: 1 })],
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
