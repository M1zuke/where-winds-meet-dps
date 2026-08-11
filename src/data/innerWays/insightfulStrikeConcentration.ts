import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import type { Effect } from "../../engine/effects/effect"
import { requireInnerWayNodeTier } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "./ids"
import { insightfulStrike } from "./insightfulStrike"

const BASE_EFFECTS: Effect[] = [stat("affinityDamageBoost", 0.1), stat("directAffinityRate", 0.03)]

// Bellstrike Umbra's tier-6 pair really does emit `sustainDamageBoost` TWICE
// (`dotDamage` and `enhancedDotDamage` both map to it) — preserve the sum,
// this is not a duplicate to collapse.
const TIER6_EFFECTS: Record<string, Effect[]> = {
  bellstrike_umbra: [stat("sustainDamageBoost", 0.1), stat("sustainDamageBoost", 0.1)],
}

// Memoized rather than a module-top-level const: `insightfulStrike.ts`
// imports this module for its `buffDefs` entry, and this module imports
// `insightfulStrike` back for the sustain-pair tier. Reading it eagerly at
// module scope would run while `insightfulStrike.ts` is still initializing
// whenever that module is the entry point — deferring the read into
// `effects`, which only runs once both modules have finished loading,
// avoids that.
let sustainPairTier: number | undefined

function sustainPairTierOf(): number {
  return (sustainPairTier ??= requireInnerWayNodeTier(
    insightfulStrike,
    INNER_WAY_NODE.concentrationSustainPair,
  ))
}

// A hoisted function, not a `const`, for the same cyclic-import reason: this
// file's own export must be callable before `insightfulStrike.ts`'s import
// back into this module has finished.
//
// Pre-existing bug, reproduced exactly rather than fixed: `seedAtStart` +
// `refreshOnAnyCast` make this permanently active for the whole rotation
// whenever its param is on, double-counting against the sibling
// `insightfulStrikeMechanic.ts`'s probability-weighted ramp model of the same
// inner way. This is why the inner way deliberately declares no `buffParam`.
export function concentrationBuffDef() {
  return defineClassBuff({
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
      if (ctx.build.paramTier(PARAM.insightfulStrike) < sustainPairTierOf()) return BASE_EFFECTS
      return [...BASE_EFFECTS, ...(TIER6_EFFECTS[ctx.build.spec ?? ""] ?? [])]
    },
  })
}
