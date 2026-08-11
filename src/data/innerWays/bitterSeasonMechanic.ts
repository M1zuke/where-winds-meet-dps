// The Bitter Season inner way: a stochastic per-hit poison proc that stacks a
// percentage target-defense reduction and decays, plus a DoT whose ticks are
// worth their probability of being up.
import {
  BITTER_SEASON_MAX_STACKS,
  bitterSeasonDebuffId,
  bitterSeasonEnvelopeWindows,
  bitterSeasonPoisonSchedule,
  bitterSeasonStackSchedule,
  type BitterSeasonPoisonSchedule,
  type BitterSeasonStackSchedule,
  type BitterSeasonTuning,
} from "../../engine/buffs/bitterSeason"
import { bitterSeasonTuningAtTier } from "./bitterSeason"
import { getBreakthrough } from "../../definitions/baseStats/breakthroughs"
import { tierFromStacks, type InnerWayDef } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID } from "./ids"
import { innerWayDefs } from "../../definitions/innerWays/defStore"
import { poisonExtensionForClass } from "../../definitions/classes/poisonExtensions"
import type { BuffStatEffect } from "../../engine/buff"
import type { Inputs } from "../../engine/types"
import type { TimelineMechanic } from "../../engine/mechanics/types"

const REMAINING_DISPLAY_THRESHOLD = 0.5

// Mirrors `slotInnerWayId`/`innerWayTier`/`henZhiActiveForInputs`
// (`definitions/innerWays/registry.ts`) against the raw store instead of
// through that registry itself. The registry unconditionally imports the
// `src/data/innerWays` barrel to guarantee it has loaded — but this mechanic
// is loaded AS PART OF the barrel building `bitterSeason.ts`, so importing
// the registry here reopens exactly the cycle the factory shape exists to
// avoid: confirmed by running the suite, `tests/engine/bitterSeason.test.ts`
// imports this inner way directly (before anything else touches the
// barrel), and `INNER_WAYS` ends up with an `undefined` slot. `defStore.ts`
// is the same data with none of that side effect, since every read here is
// deferred into `prepare()`, long after the whole module graph has settled.
function slotIdViaStore(slot: { id?: string; name: string }): string {
  if (slot.id !== undefined) return slot.id
  if (!slot.name) return ""
  if (innerWayDefs().some((def) => def.id === slot.name)) return slot.name
  return innerWayDefs().find((def) => def.name === slot.name)?.id ?? slot.name
}

function tierIfSlotted(mindMethods: Inputs["mindMethods"]): number | null {
  const slot = mindMethods.find(
    (candidate) => slotIdViaStore(candidate) === INNER_WAY_ID.bitterSeason,
  )
  return slot ? tierFromStacks(slot.stacks) : null
}

function activeDefsViaStore(mindMethods: Inputs["mindMethods"]): InnerWayDef[] {
  const out: InnerWayDef[] = []
  for (const def of innerWayDefs()) {
    if (!def.scalars) continue
    const slot = mindMethods.find((candidate) => slotIdViaStore(candidate) === def.id)
    if (!slot) continue
    if (def.scalars.minTier && tierFromStacks(slot.stacks) < def.scalars.minTier) continue
    out.push(def)
  }
  return out
}

// Mirrors `panel.ts henZhiActiveForInputs` — the party-applied debuff, or any
// slotted inner way whose `scalars.targetDefenseMultiplier` is set (none is,
// today).
function henZhiActive(inputs: Inputs): boolean {
  if (inputs.shareDebuff5HenZhi) return true
  return activeDefsViaStore(inputs.mindMethods).some(
    (def) => def.scalars?.targetDefenseMultiplier !== undefined,
  )
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

// A hoisted factory, not a plain object: `bitterSeason.ts` declares this as
// its mechanic, so this file's own top-level export must be safe to call
// before `./bitterSeason`'s cyclic import back into this module has finished
// — a function declaration is, an object literal bound to a `const` is not.
export function bitterSeasonMechanic(): TimelineMechanic<State> {
  return {
    id: "bitterSeasonPoison",

    prepare(setup) {
      const tier = tierIfSlotted(setup.inputs.mindMethods)
      if (tier === null) return null
      const tuning = bitterSeasonTuningAtTier(tier)
      return {
        debuffId: bitterSeasonDebuffId(setup.classId),
        tuning,
        stacks: bitterSeasonStackSchedule(
          setup.hitTimesSec,
          tuning.procChance,
          setup.rotationDurationSec,
        ),
        baseTargetDefense: getBreakthrough(setup.inputs.breakthrough).defense,
        suppressed: henZhiActive(setup.inputs),
        poison: null,
      }
    },

    // The poison's own windows: bounded to the guaranteed-proc envelope rather
    // than one span covering the rotation, since `activeProbAtTime` is 0
    // outside it and no expected damage is lost by not ticking there.
    seedStatuses(state, target, setup) {
      if (setup.rotationDurationSec <= 0 || setup.hitTimesSec.length === 0) return
      if (!target.hasStatus(state.debuffId)) return
      const durationFrames = target.statusDurationFrames(state.debuffId) ?? 0
      if (durationFrames <= 0) return

      const extension = poisonExtensionForClass(setup.classId)
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
      // Stated as the target physical defense reduction the in-game hint words
      // it as, even though the tier-6 node is implemented through
      // `phys.penetration`.
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
}
