import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { SCRIPT_MIN_BREAKTHROUGH } from "./scriptOptions"
import { stat } from "../../../engine/effects/effect"
import { COMBAT_ENTRY_STACK_BONUS, combatEntryStacks } from "./combatEntryStacks"

// In-game values as of 2026-10-18.
export const wavebornScript = defineBuff({
  id: BUFF.wavebornScript,
  name: "Waveborn Script",
  requires: {
    param: PARAM.wavebornScript,
    minBreakthrough: SCRIPT_MIN_BREAKTHROUGH.wavebornScript,
  },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "critDmg +1%/stack, up to 10 stacks; one stack at combat entry, then one every 3 s",
  effects: (ctx) => {
    const stacks = combatEntryStacks(ctx)
    return stacks > 0 ? [stat("critDamageBoost", COMBAT_ENTRY_STACK_BONUS * stacks)] : []
  },
})
