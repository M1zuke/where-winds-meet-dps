import type { Result } from "../../../engine/types"

// docs/UI.md § "Fight clock": every displayed time counts from the fight's
// own start (the first damaging hit), never from the engine's internal frame
// zero. `Result` keeps its absolute seconds, so every view converts at render
// through this one function.
export function fightClockSec(result: Result, absoluteSec: number): number {
  return absoluteSec - result.fightStartSec
}
