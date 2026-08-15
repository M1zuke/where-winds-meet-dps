import { DEFAULT_BEHAVIOR, type SkillBehavior, type BuildView } from "../../engine/behavior"
import { forceOutcome, type HitEffect } from "../../engine/effects/effect"
import { innerWayHasNode } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "./ids"
import { swordMorph } from "./swordMorph"

// Position in `Skill.hits` is a hit's identity, so the two-wave cast never
// reaches this index rather than needing to be excluded.
const THIRD_WAVE = 2

// "The multiple sword energy attacks will not cause Abrasion when hitting
// Exhausted units, and the third one is guaranteed to be an Affinity hit
// against Exhausted non-player units" (client localization, 2026-08-15).
// Exhausted is the qi-break window, which is what `HitContext.phase` reports.
//
// A hoisted function, not a `const`: `swordMorph.ts` imports this module for
// its `skillBehaviors` entry and this module imports `swordMorph` back for its
// tier, so whichever loads second would read an uninitialized binding.
export function swordMorphExhaustedBehavior(build: BuildView): SkillBehavior | null {
  const tier = build.innerWayTier(swordMorph.id)
  if (tier === null) return null
  if (!innerWayHasNode(swordMorph, tier, INNER_WAY_NODE.exhaustedSwordEnergyOutcome)) return null

  return {
    ...DEFAULT_BEHAVIOR,

    buildArt(input, context) {
      const art = DEFAULT_BEHAVIOR.buildArt.call(this, input, context)
      if (context.phase === "exhausted") art.guaranteedPrecision = 1
      return art
    },

    claimStatEffects(input, phase): HitEffect[] {
      if (phase !== "exhausted") return []
      return input.skill.hits.indexOf(input.hit) === THIRD_WAVE ? [forceOutcome("affinity")] : []
    },
  }
}
