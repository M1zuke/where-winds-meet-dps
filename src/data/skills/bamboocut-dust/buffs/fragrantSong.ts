import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { forceOutcome, stat } from "../../../../engine/effects/effect"
import { BUFF } from "../../buffs/ids"
import { STATUS } from "../ids"

// Talent "Perfect Catch Enhancement": the throw cast under Fragrant Song
// always crits and deals 20% more damage against non-player targets (in-game
// values as of 2026-10-12). Reads the per-throw marker, not Fragrant Song
// itself, so the throw that earns the song is not boosted by it.
export const fragrantSong = defineClassBuff({
  id: BUFF.fragrantSong,
  name: "Fragrant Song",
  alwaysActive: true,
  duration: 9999,
  summary: "forced crit and allDamageBoost +20% on a throw cast under Fragrant Song",
  effects: (ctx) =>
    ctx.self.reachesEvent && ctx.status.isActive(STATUS.fragrantSongLogic)
      ? [forceOutcome("crit"), stat("allDamageBoost", 0.2)]
      : [],
})
