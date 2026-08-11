import { defineClassBuff } from "./define"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"
import type { Effect } from "../../../engine/effects/effect"
import { requireInnerWayNodeTier } from "../../innerWays/define"
import { INNER_WAY_NODE } from "../../innerWays/ids"
import { insightfulStrike } from "../../innerWays/insightfulStrike"

// The lowest tier the sustain-damage pair (`sustainDamageBoost` ×2) requires —
// `insightfulStrike.ts` declares it, so the number appears exactly once.
const SUSTAIN_PAIR_TIER = requireInnerWayNodeTier(insightfulStrike, INNER_WAY_NODE.concentrationSustainPair)

const BASE_EFFECTS: Effect[] = [stat("affinityDamageBoost", 0.1), stat("directAffinityRate", 0.03)]

// Bellstrike Umbra's tier-6 pair really does emit `sustainDamageBoost` TWICE
// (`dotDamage` and `enhancedDotDamage` both map to it) — preserve the sum,
// this is not a duplicate to collapse.
const TIER6_EFFECTS: Record<string, Effect[]> = {
  bellstrike_umbra: [stat("sustainDamageBoost", 0.1), stat("sustainDamageBoost", 0.1)],
}

// Pre-existing bug, reproduced exactly rather than fixed — see
// docs/CALCULATION.md § "Mechanic coverage": `seedAtStart` + `refreshOnAnyCast`
// make this permanently active for the whole rotation whenever its param is
// on, double-counting against `bellstrikeUmbraConcentration.ts`'s
// probability-weighted ramp model of the same inner way.
export const concentration = defineClassBuff({
  id: BUFF.concentration,
  name: "Concentration",
  requires: { param: PARAM.insightfulStrike },
  triggeredBy: [],
  duration: 10,
  seedAtStart: true,
  refreshOnAnyCast: true,
  // The pre-conversion `BuffDef` rendered only its base `statModifiers` here —
  // the tier-6 pair was never read by the display path either. Reproduce that
  // omission rather than the more informative string a fresh author would pick.
  summary: "affinityDmg +10%, directAffinity +3%",
  effects: (ctx) => {
    if (ctx.event.kind === "cast") return []
    if (ctx.event.kind !== "damage") return BASE_EFFECTS
    if (ctx.build.paramTier(PARAM.insightfulStrike) < SUSTAIN_PAIR_TIER) return BASE_EFFECTS
    return [...BASE_EFFECTS, ...(TIER6_EFFECTS[ctx.build.spec ?? ""] ?? [])]
  },
})
