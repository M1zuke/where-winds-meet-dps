// Placeholder content authored for this file: the lockout, release and
// before-hit rules of docs/TIMELINE.md § "Meters", on the shared Endurance
// meter bellstrikeUmbra registers.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeBuff } from "../../src/engine/buff"
import {
  makeHit,
  makeSkill,
  makeTrigger,
  type HitTrigger,
  type Skill,
} from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import type { Inputs, UnclaimedOddityNodes } from "../../src/engine/types"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"

const CLASS = "bellstrikeUmbra"
const METER_ID = enduranceMeter.id
const LOCKOUT_GROUP = "testLockout"

const NO_ODDITY_ENDURANCE: UnclaimedOddityNodes = {
  Qinghe: [101, 112, 126, 139],
  Kaifeng: [205, 222],
  Hexi: [305, 324],
}

const hitWith = (frame: number, triggers: HitTrigger[] = []) =>
  makeHit({ frame, physMultiplier: 1, physFixed: 1, triggers })

const skillWith = (name: string, castFrames: number, patch: Partial<Skill> = {}): Skill =>
  makeSkill(CLASS, { name, castFrames, hits: [hitWith(0)], ...patch })

const lockedGain = (patch: Partial<HitTrigger> = {}): HitTrigger =>
  makeTrigger({
    kind: "meterDelta",
    targetId: METER_ID,
    stacks: 10,
    cooldownFrames: 180,
    cooldownGroup: LOCKOUT_GROUP,
    ...patch,
  })

const release = (): HitTrigger =>
  makeTrigger({
    kind: "cooldownCut",
    targetId: LOCKOUT_GROUP,
    stacks: 180,
    appliesOnCastEnd: true,
  })

const spender = skillWith("Spender", 6, { meterCosts: [{ meterId: METER_ID, amount: 80 }] })
const observer = skillWith("Observer", 6)

function endLevel(
  skills: Skill[],
  buffs = [] as ReturnType<typeof makeBuff>[],
  patch: Partial<Inputs> = {},
) {
  const library = [...skills, observer]
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    customSkills: [spender, ...library],
    customBuffs: buffs,
    activeCustomRotation: testRotation(CLASS, {
      steps: [spender, ...library].map((skill) => makeStep({ skillId: skill.id })),
    }),
    set: null,
    unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
    ...patch,
  }
  const result = simulateTimeline(inputs)
  const levels = result.casts!.map(
    (cast) => cast.meterLevels!.find((level) => level.id === METER_ID)!.amount,
  )
  return levels[levels.length - 1]!
}

describe("a cooldown group shared by meterDelta triggers on different skills", () => {
  const granter = (name: string) => skillWith(name, 12, { hits: [hitWith(0, [lockedGain()])] })
  const plain = (name: string) => skillWith(name, 12)

  it("locks the later skill out for the group's length", () => {
    const first = granter("First")
    const second = granter("Second")
    expect(endLevel([first, second])).toBe(endLevel([first, plain("Plain")]))
  })

  it("lets the later skill gain again once the lockout has run out", () => {
    const first = granter("First")
    const wait = skillWith("Wait", 200)
    const second = granter("Second")
    expect(endLevel([first, wait, second])).toBe(endLevel([first, wait, plain("Plain")]) + 10)
  })
})

describe("a cooldownCut carrying appliesOnCastEnd", () => {
  const granter = skillWith("First", 12, { hits: [hitWith(0, [lockedGain()])] })
  const later = skillWith("Second", 12, { hits: [hitWith(0, [lockedGain()])] })
  const plain = skillWith("Plain", 12)
  const releaser = skillWith("Releaser", 20, { hits: [hitWith(0, [release()])] })

  it("releases the shared group at its cast's end so the next cast gains again", () => {
    expect(endLevel([granter, releaser, later])).toBe(endLevel([granter, releaser, plain]) + 10)
  })

  it("leaves the group locked when no cast releases it", () => {
    const idle = skillWith("Idle", 20)
    expect(endLevel([granter, idle, later])).toBe(endLevel([granter, idle, plain]))
  })

  it("lands at the cast's laid end, which a hit variant's shorter cast length has already cut short", () => {
    const param = "meterGainLockoutTestParam"
    const cutShort = skillWith("Cut Short", 200, {
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          triggers: [release()],
          variants: [
            {
              id: "hv-cut-short",
              label: "Cut short",
              conditions: [{ param }],
              physMultiplier: 1,
              attributeMultiplier: 0,
              physFixed: 1,
              attributeFixed: 0,
              castFrames: 20,
            },
          ],
        }),
      ],
    })
    const inputs = { buffParams: { [param]: true } }
    expect(endLevel([granter, cutShort, later], [], inputs)).toBe(
      endLevel([granter, cutShort, plain], [], inputs) + 10,
    )
  })
})

describe("a meterDelta trigger's conditionsBeforeHit", () => {
  const marker = makeBuff(CLASS, { name: "Marker", activation: "triggered", durationFrames: 600 })
  const marked = { buffId: marker.id, op: "gte" as const, stacks: 1 }
  const grantsMarker = makeTrigger({ kind: "applyBuff", targetId: marker.id })
  const stackerWith = (conditionsBeforeHit: boolean) =>
    skillWith("Stacker", 12, {
      hits: [
        hitWith(0, [
          grantsMarker,
          makeTrigger({
            kind: "meterDelta",
            targetId: METER_ID,
            stacks: 10,
            condition: marked,
            ...(conditionsBeforeHit ? { conditionsBeforeHit } : {}),
          }),
        ]),
      ],
    })

  const idle = skillWith("Idle", 12)
  const baseline = () => endLevel([idle, { ...idle, id: "second-idle" }], [marker])

  it("does not see a status the same hit's own trigger grants", () => {
    const stacker = stackerWith(true)
    expect(endLevel([stacker, { ...stacker, id: "second-stacker" }], [marker])).toBe(
      baseline() + 10,
    )
  })

  it("reads the status the same hit grants when it is not set", () => {
    const stacker = stackerWith(false)
    expect(endLevel([stacker, { ...stacker, id: "second-stacker" }], [marker])).toBe(
      baseline() + 20,
    )
  })
})

describe("a meterCosts entry with atFrame", () => {
  it("spends that many frames into the cast, not at its start", () => {
    const delayed = skillWith("Delayed", 20, {
      meterCosts: [{ meterId: METER_ID, amount: 20, atFrame: 30 }],
    })
    const idle = skillWith("Idle", 20)
    const lateObserver = { ...observer, id: "late-observer", name: "Late Observer" }
    const levelsOf = (skills: Skill[]) => {
      const library = [delayed, ...skills]
      const result = simulateTimeline({
        ...defaultInputs,
        classId: CLASS,
        customSkills: library,
        activeCustomRotation: testRotation(CLASS, {
          steps: library.map((skill) => makeStep({ skillId: skill.id })),
        }),
        set: null,
        unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
      })
      return result.casts!.map((cast) => cast.meterLevels![0]!.amount)
    }
    expect(levelsOf([observer, idle, lateObserver])).toEqual([80, 80, 80, 60])
  })
})
