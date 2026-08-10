// The Bitter Season inner way: a stochastic per-hit poison proc that stacks a
// percentage target-defense reduction and decays, plus a DoT whose ticks are
// worth their probability of being up.
import {
  BITTER_SEASON_INNER_WAY,
  BITTER_SEASON_MAX_STACKS,
  bitterSeasonDebuffId,
  bitterSeasonEnvelopeWindows,
  bitterSeasonPoisonSchedule,
  bitterSeasonStackSchedule,
  resolveBitterSeasonTuning,
  type BitterSeasonPoisonSchedule,
  type BitterSeasonStackSchedule,
  type BitterSeasonTuning,
} from "../buffs/bitterSeason"
import { getBreakthrough, henZhiActiveForInputs } from "../panel"
import { innerWayTier } from "../../data/classes/innerWays"
import type { BuffStatEffect } from "../buff"
import { MECHANIC_ORDER, registerMechanic } from "./index"
import type { TimelineMechanic } from "./types"

const REMAINING_DISPLAY_THRESHOLD = 0.5

// A class inner way can extend an active poison — Sword Horizon's Zenith does.
// Registered rather than imported, so this file names no class.
let extension: { statusId: string; maxRemainingSec: number } | null = null

export function registerPoisonExtension(statusId: string, maxRemainingSec: number): void {
  extension = { statusId, maxRemainingSec }
}

interface State {
  debuffId: string
  tuning: BitterSeasonTuning
  stacks: BitterSeasonStackSchedule
  baseTargetDefense: number
  // A party-applied Bitter Season debuff already caps the reduction, so the
  // inner way adds none — but its poison still ticks.
  suppressed: boolean
  poison: BitterSeasonPoisonSchedule | null
}

export const bitterSeasonMechanic: TimelineMechanic<State> = {
  id: "bitterSeasonPoison",

  prepare(setup) {
    const tier = innerWayTier(setup.inputs.mindMethods, BITTER_SEASON_INNER_WAY)
    if (tier === null) return null
    const tuning = resolveBitterSeasonTuning(tier)
    return {
      debuffId: bitterSeasonDebuffId(setup.classId),
      tuning,
      stacks: bitterSeasonStackSchedule(
        setup.hitTimesSec,
        tuning.procChance,
        setup.rotationDurationSec,
      ),
      baseTargetDefense: getBreakthrough(setup.inputs.breakthrough).defense,
      suppressed: henZhiActiveForInputs(setup.inputs),
      poison: null,
    }
  },

  // The poison's own windows: bounded to the guaranteed-proc envelope rather
  // than one span covering the rotation, since `activeProbAtTime` is 0 outside
  // it and no expected damage is lost by not ticking there.
  seedStatuses(state, target, setup) {
    if (setup.rotationDurationSec <= 0 || setup.hitTimesSec.length === 0) return
    if (!target.hasStatus(state.debuffId)) return
    const durationFrames = target.statusDurationFrames(state.debuffId) ?? 0
    if (durationFrames <= 0) return

    const extensionTimesSec = extension
      ? target.ledger
          .windowsOf(extension.statusId)
          .map((window) => window.start / setup.fps)
          .sort((a, b) => a - b)
      : []
    const maxRemainingSec = extension?.maxRemainingSec ?? Infinity
    const poisonDurationSec = durationFrames / setup.fps

    state.poison = bitterSeasonPoisonSchedule(
      setup.hitTimesSec,
      state.tuning.procChance,
      poisonDurationSec,
      setup.rotationDurationSec,
      extensionTimesSec,
      maxRemainingSec,
    )
    for (const envelope of bitterSeasonEnvelopeWindows(
      setup.hitTimesSec,
      poisonDurationSec,
      extensionTimesSec,
      maxRemainingSec,
    )) {
      target.ledger.pushWindow(
        state.debuffId,
        Math.round(envelope.startSec * setup.fps),
        Math.round(envelope.endSec * setup.fps),
      )
    }
    target.ledger.recordStack(
      state.debuffId,
      Math.max(0, Math.round(setup.hitTimesSec[0] * setup.fps)),
      1,
    )
  },

  contributeAt(state, frame, _skill, setup) {
    if (state.suppressed) return null
    const timeSec = frame / setup.fps
    const effects: BuffStatEffect[] = []
    const stacks = state.stacks.expectedStacksAtTime(timeSec)
    if (stacks > 0) {
      effects.push({
        statKey: "target.defense",
        amount: -stacks * state.tuning.defenseReductionPerStack * state.baseTargetDefense,
      })
    }
    if (state.tuning.physPenetrationAtMaxStacks > 0) {
      const maxStackProb = state.stacks.maxStackProbAtTime(timeSec)
      if (maxStackProb > 0) {
        effects.push({
          statKey: "phys.penetration",
          amount: state.tuning.physPenetrationAtMaxStacks * maxStackProb,
        })
      }
    }
    return effects.length > 0 ? { effects } : null
  },

  tickWeightAt(state, debuffId, frame, setup) {
    if (debuffId !== state.debuffId || !state.poison) return null
    return state.poison.activeProbAtTime(frame / setup.fps)
  },

  // Below the display threshold there is a real chance no poison has procced
  // yet, so the expected-remaining number alone would read as an oddly short
  // duration — withhold it until more likely than not to be up.
  remainingSecAt(state, id, timeSec) {
    if (id !== state.debuffId || !state.poison) return null
    const likely = state.poison.activeProbAtTime(timeSec) >= REMAINING_DISPLAY_THRESHOLD
    const activeSec = likely ? state.poison.remainingActiveSecAtTime(timeSec) : 0
    return { seconds: activeSec > 0 ? activeSec : undefined }
  },

  display(state, timeSec, prePull) {
    if (prePull) return []
    const shown = state.suppressed
      ? BITTER_SEASON_MAX_STACKS
      : Math.round(state.stacks.expectedStacksAtTime(timeSec))
    if (shown < 1) return []
    const uptimePct = Math.round((state.poison?.activeProbAtTime(timeSec) ?? 0) * 100)
    // Stated as the target physical defense reduction the in-game hint words it
    // as, even though the tier-6 node is implemented through `phys.penetration`.
    const currentDefensePct = Math.round(state.tuning.defenseReductionPerStack * shown * 100)
    const tier6FlatAmount = state.tuning.physPenetrationAtMaxStacks * 100
    const mechanicText =
      `at ${shown}/${BITTER_SEASON_MAX_STACKS} stacks: -${currentDefensePct}% target physical defense` +
      (tier6FlatAmount > 0
        ? ` · -${tier6FlatAmount} target physical defense at ${BITTER_SEASON_MAX_STACKS}/${BITTER_SEASON_MAX_STACKS} stacks (tier 6)`
        : "")
    return [
      {
        id: "bitterSeasonPoison",
        name: "Bitter Season Poison",
        stacks: shown,
        maxStacks: BITTER_SEASON_MAX_STACKS,
        effects: [],
        description: state.suppressed
          ? "party-applied Bitter Season debuff already caps the reduction — the inner way adds none"
          : `expected stacks (avg of 500 sims, rounded) · ${mechanicText} · ≈${uptimePct}% poison uptime`,
      },
    ]
  },
}

registerMechanic(bitterSeasonMechanic, MECHANIC_ORDER.bitterSeason)
