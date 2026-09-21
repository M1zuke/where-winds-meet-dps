import type { Skill } from "../../engine/skill"
import type { MechanicEvent, MechanicSetup, TimelineMechanic } from "../../engine/mechanics/types"

const BURN_NAME = "Divinecraft - Fire"
// In-game values as of 2026-09-11.
const BURN_WINDOW_SEC = 4
const TICK_INTERVAL_SEC = 1
const FIRST_TICK_LEAD_SEC = 0.5
const BURN_PHYS_MULTIPLIER = 0.26

type State = Record<string, never>

interface BurnWindow {
  openAt: number
  endAt: number
}

function burnWindows(hitTimesSec: readonly number[]): BurnWindow[] {
  const windows: BurnWindow[] = []
  for (const hitTime of hitTimesSec) {
    const current = windows[windows.length - 1]
    if (current && hitTime < current.endAt) current.endAt = hitTime + BURN_WINDOW_SEC
    else windows.push({ openAt: hitTime, endAt: hitTime + BURN_WINDOW_SEC })
  }
  return windows
}

function burnTickTimesSec(hitTimesSec: readonly number[], rotationDurationSec: number): number[] {
  const ticks: number[] = []
  for (const window of burnWindows(hitTimesSec)) {
    const windowEndSec = Math.min(window.endAt, rotationDurationSec)
    for (
      let tickTimeSec = window.openAt + FIRST_TICK_LEAD_SEC;
      tickTimeSec < windowEndSec;
      tickTimeSec += TICK_INTERVAL_SEC
    ) {
      ticks.push(tickTimeSec)
    }
  }
  return ticks
}

function burnSkill(classId: string): Skill {
  return {
    id: "divinecraft-fire",
    classId,
    name: BURN_NAME,
    breakdownName: BURN_NAME,
    skillType: "mindMethod",
    weaponOrAttribute: "",
    attributeAttack: "",
    hits: [],
    castFrames: 0,
    triggerable: false,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
  }
}

export function fireOilBurnMechanic(): TimelineMechanic<State> {
  return {
    id: "fireOilBurn",

    prepare(setup) {
      return setup.inputs.divinecraft === "fire" ? {} : null
    },

    extraEvents(_state, setup: MechanicSetup) {
      const skill = burnSkill(setup.classId)
      return burnTickTimesSec(setup.hitTimesSec, setup.rotationDurationSec).map(
        (tickTimeSec): MechanicEvent => ({
          frame: Math.round(tickTimeSec * setup.fps),
          skill,
          art: {
            name: BURN_NAME,
            physMultiplier: BURN_PHYS_MULTIPLIER,
            attributeMultiplier: 0,
            physFixed: 0,
            attributeFixed: 0,
            guaranteedNormal: 1,
            skillType: "mindMethod",
          },
          name: BURN_NAME,
          type: "mindMethod",
        }),
      )
    },
  }
}
