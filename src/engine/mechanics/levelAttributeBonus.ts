// A flat attribute-attack add the player's level grants to the bleed skills.
// Class-gated in the data it reads, not by an `if` here.
import { APP_PLAYER_LEVEL, playerLevelAttributeAttackBonus } from "../buffs/levelAttributeBonus"
import type { TimelineMechanic } from "./types"

const CLASS_ID = "bellstrikeUmbra"
const ROLES = ["role:bleedDetonation", "role:bleedTick"]

type State = { bonus: number }

export const levelAttributeBonusMechanic: TimelineMechanic<State> = {
  id: "levelAttributeBonus",

  prepare(setup) {
    if (!setup.hasBuffEngine || setup.classId !== CLASS_ID) return null
    const bonus = playerLevelAttributeAttackBonus(APP_PLAYER_LEVEL)
    return bonus === 0 ? null : { bonus }
  },

  contributeAt(state, _frame, skill) {
    if (!skill || !ROLES.some((role) => skill.tags?.includes(role))) return null
    return {
      effects: [
        { statKey: "bellstrike.min", amount: state.bonus },
        { statKey: "bellstrike.max", amount: state.bonus },
      ],
    }
  },
}
