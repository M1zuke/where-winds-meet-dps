import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"

export const spearq5HitCancel = defineSkill({
  id: SKILL.spearq5HitCancel,
  classId: "bellstrikeUmbra",
  name: "SpearQ 5-Hit Cancel",
  breakdownName: "Sober Sorrow",
  tags: [WEAPON.spear, ATTUNE.spearQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearQ5HitCancel,
  triggersBuffs: [BUFF.wineGu, BUFF.soulShaken, BUFF.jadeware],
  receives: [BUFF.wolfchasersArtMartialDamage, ...HEAVENQUAKER_SPEAR_RECEIVES],
  // A cancel form ends where the animation opens its interrupt window — 101 frames in (in-game animation, 2026-09-09); the parry that ends it is the next rotation step.
  castFrames: 101,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.321033,
      attributeMultiplier: 0.4815495,
      physFixed: 88.95,
      attributeFixed: 48.45,
    }),
    hit(1, {
      frame: 31,
      physMultiplier: 0.321033,
      attributeMultiplier: 0.4815495,
      physFixed: 88.95,
      attributeFixed: 48.45,
    }),
    hit(2, {
      frame: 45,
      physMultiplier: 0.321033,
      attributeMultiplier: 0.4815495,
      physFixed: 88.95,
      attributeFixed: 48.45,
    }),
    hit(3, {
      frame: 62,
      physMultiplier: 0.321033,
      attributeMultiplier: 0.4815495,
      physFixed: 88.95,
      attributeFixed: 48.45,
    }),
    hit(4, {
      frame: 82,
      physMultiplier: 0.321033,
      attributeMultiplier: 0.4815495,
      physFixed: 88.95,
      attributeFixed: 48.45,
      triggers: [applyBuff({ target: BUFF.potentRiverFlow, appliesOnCastEnd: true })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
