import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { starweave } from "../../sets/starweave"

const DURATION_SEC = 5.1
const MAX_STACKS = 5
const PER_STACK = 0.03
const RANGE_BANDS: readonly { atOrAboveMeters: number; perStack: number }[] = [
  { atOrAboveMeters: 8, perStack: 0.01 },
  { atOrAboveMeters: 7, perStack: 0.008 },
  { atOrAboveMeters: 6, perStack: 0.006 },
  { atOrAboveMeters: 5, perStack: 0.004 },
  { atOrAboveMeters: 4, perStack: 0.002 },
]

function rangeBonusPerStack(distanceMeters: number): number {
  return RANGE_BANDS.find((band) => distanceMeters >= band.atOrAboveMeters)?.perStack ?? 0
}

// "When hitting at least 2 enemies simultaneously, or hitting a boss or
// player, you gain 1 stack of Starweave: For 5 seconds, Martial Art Skills
// deal 3% increased damage and further bonus damage to enemies more than 4
// meters away, up to 1% at 8 meters. Up to 2 stacks per second." (in-game set
// tooltip, 2026-09-24.) Reach is the skills that declare this in their own
// `receives` — the Martial Art Skill (class-108) hits across every class.
export const starweaveMartialBoost = defineBuff({
  id: BUFF.starweaveMartialBoost,
  name: "Starweave",
  requires: { set: starweave.siteKey },
  duration: DURATION_SEC,
  maxStacks: MAX_STACKS,
  stackOnDamage: true,
  stackOnDamageRateLimit: { count: 2, window: 1 },
  summary: "allDamageBoost +3%/stack (Martial Art Skill hits only, more at range)",
  effects: (ctx) => [
    stat("allDamageBoost", (PER_STACK + rangeBonusPerStack(ctx.target.distanceMeters)) * ctx.self.stacks),
  ],
})
