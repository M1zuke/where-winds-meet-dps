import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import {
  EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST,
  EMPOWERED_RIVER_FLOW_BUFF_ID,
  RIVER_FLOW_MIN_BLEEDING_STACKS,
  RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES,
  SPRING_SURGE_BUFF_ID,
  WATER_DROP_BUFF_ID,
} from "../../innerWays/wolfchasersArtGates"

export const spearq = defineSkill({
  id: SKILL.spearq,
  classId: "bellstrikeUmbra",
  name: "SpearQ",
  breakdownName: "Sober Sorrow",
  tags: [WEAPON.spear, ATTUNE.spearQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearQ,
  triggersBuffs: [BUFF.wineGu, BUFF.soulShaken, BUFF.jadeware],
  receives: [BUFF.wolfchasersArtMartialDamage, ...HEAVENQUAKER_SPEAR_RECEIVES],
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 120,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach, plus a further 1.75 m
  // shrink-only pull once in range.
  reachMeters: 3,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
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
      // In-game values as of 2026-09-24: the tier is Sober Sorrow's combo
      // count (its own 6 hits plus the target's Bleeding stacks) — see the
      // rule in `wolfchasersArtGates.ts`.
      triggers: [
        applyBuff({ target: WATER_DROP_BUFF_ID, appliesOnCastEnd: true }),
        applyBuff({
          target: WATER_DROP_BUFF_ID,
          appliesOnCastEnd: true,
          requiresParam: PARAM.wolfchasersArt,
          extendFrames: RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES,
          extendOnly: true,
        }),
        applyBuff({ target: SPRING_SURGE_BUFF_ID, appliesOnCastEnd: true }),
        applyBuff({
          target: SPRING_SURGE_BUFF_ID,
          appliesOnCastEnd: true,
          requiresParam: PARAM.wolfchasersArt,
          extendFrames: RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES,
          extendOnly: true,
        }),
        applyBuff({
          target: BUFF.potentRiverFlow,
          appliesOnCastEnd: true,
          condition: { buffId: DEBUFF.bleedTick, op: "gte", stacks: RIVER_FLOW_MIN_BLEEDING_STACKS },
        }),
        applyBuff({
          target: EMPOWERED_RIVER_FLOW_BUFF_ID,
          appliesOnCastEnd: true,
          condition: {
            buffId: DEBUFF.bleedTick,
            op: "gte",
            stacks: EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST,
          },
        }),
      ],
    }),
    hit(5, {
      frame: 98,
      physMultiplier: 0.535055,
      attributeMultiplier: 0.8025825,
      physFixed: 148.25,
      attributeFixed: 80.75,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})
