import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { stat } from "../../../../engine/effects/effect"
import { BUFF, PARAM } from "../../buffs/ids"

const LATER_RANKS_MIN_TIER = 3
const DURATION_SEC = 7.1
const MAX_STACKS = 5

// In-game values as of 2026-10-12: ranks 1-2 gain one stack a second for +2%
// Critical Damage each, rank 3 on gains two a second for +3% each. The buff
// crit-damage term and the panel term share the formula's one crit-damage
// bracket, so both are authored as `critDamageBoost`.
export const tangMelodyEarlyRanks = defineClassBuff({
  id: BUFF.tangMelodyEarlyRanks,
  name: "Tang Melody (ranks 1-2)",
  requires: { param: PARAM.songOfTang },
  duration: DURATION_SEC,
  maxStacks: MAX_STACKS,
  stackOnDamage: true,
  stackOnDamageScoped: true,
  stackOnDamageRateLimit: { count: 1, window: 1 },
  summary: "critDamageBoost +2%/stack on Martial Art Skill hits",
  effects: (ctx) =>
    ctx.build.paramTier(PARAM.songOfTang) >= LATER_RANKS_MIN_TIER
      ? []
      : [stat("critDamageBoost", 0.02 * ctx.self.stacks)],
})

export const tangMelodyLaterRanks = defineClassBuff({
  id: BUFF.tangMelodyLaterRanks,
  name: "Tang Melody",
  requires: { param: PARAM.songOfTang, minTier: LATER_RANKS_MIN_TIER },
  duration: DURATION_SEC,
  maxStacks: MAX_STACKS,
  stackOnDamage: true,
  stackOnDamageScoped: true,
  stackOnDamageRateLimit: { count: 2, window: 1 },
  summary: "critDamageBoost +3%/stack on Martial Art Skill hits",
  effects: (ctx) => [stat("critDamageBoost", 0.03 * ctx.self.stacks)],
})
