// Scoped to the unvalidated Silkbind Jade floating umbrella: wiring, not a damage anchor.
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { dotTickSkill } from "../../src/engine/dot"
import { makeStep } from "../../src/engine/rotation"
import { projectileTravelFrames } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { DEBUFFS } from "../../src/data/skills/silkbind-jade/debuffs"
import {
  DRONE_BULLET_PROJECTILE,
  DRONE_FIRST_TICK_OFFSET_FRAMES,
  DRONE_INTERVAL_FRAMES,
} from "../../src/data/skills/silkbind-jade/droneTick"
import { DEBUFF, SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { testRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"

const CLASS = "silkbindJade"
const DRONE_ROW = "UmbDrone[20hit] (DoT)"
const LAUNCH_ATTACH_FRAME = 36

function droneInputs(patch: Partial<Inputs> = {}): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: testRotation(CLASS, {
      steps: [SKILL.umbdronelaunch20Hit, SKILL.fanspecial, SKILL.fanspecial].map((skillId) =>
        makeStep({ skillId }),
      ),
    }),
    ...patch,
  }
}

const droneEvents = (inputs: Inputs) =>
  simulateTimeline(inputs, { collect: "full" }).timeline!.filter(
    (event) => event.skillName === DRONE_ROW,
  )

const droneDamage = (inputs: Inputs) =>
  droneEvents(inputs).reduce((sum, event) => sum + event.damage, 0)

describe("the floating umbrella's bullets", () => {
  const debuff = DEBUFFS.find((candidate) => candidate.id === DEBUFF.umbdrone20Hit)!

  it("are direct weapon hits, not damage-over-time ticks", () => {
    expect(debuff.dot).toMatchObject({ directHit: true, skillType: "weapon" })
    expect(dotTickSkill(debuff).isDotTick).toBe(false)
  })

  it("take no Sustain damage boost", () => {
    const plain = droneDamage(droneInputs())
    expect(plain).toBeGreaterThan(0)
    expect(droneDamage(droneInputs({ sustainDamageBoost: 0.5 }))).toBe(plain)
  })

  it("take the umbrella's weapon damage boost", () => {
    const plain = droneDamage(droneInputs())
    expect(droneDamage(droneInputs({ umbrellaBoost: 0.5 }))).toBeGreaterThan(plain)
  })

  it("land after the flight from the umbrella to the target, not on the pulse", () => {
    const result = simulateTimeline(droneInputs(), { collect: "full" })
    const launchCast = result.casts![0]!
    const travelFrames = Math.round(
      projectileTravelFrames(DRONE_BULLET_PROJECTILE, launchCast.distanceMeters),
    )
    expect(travelFrames).toBeGreaterThan(0)
    const [first, second] = result.timeline!.filter((event) => event.skillName === DRONE_ROW)
    const pulse = LAUNCH_ATTACH_FRAME + DRONE_FIRST_TICK_OFFSET_FRAMES
    expect(first!.frame).toBe(pulse + travelFrames)
    expect(second!.frame - first!.frame).toBe(DRONE_INTERVAL_FRAMES)
  })

  it("fly at 30 m/s for at most a second", () => {
    expect(projectileTravelFrames(DRONE_BULLET_PROJECTILE, 15)).toBeCloseTo(30)
    expect(projectileTravelFrames(DRONE_BULLET_PROJECTILE, 90)).toBe(60)
  })
})

describe("Spring Away's bullets", () => {
  const springAway = (patch: Partial<Inputs> = {}) =>
    simulateTimeline(
      {
        ...defaultInputs,
        classId: CLASS,
        activeCustomRotation: testRotation(CLASS, {
          steps: [makeStep({ skillId: SKILL.umblightcharge })],
        }),
        ...patch,
      },
      { collect: "full" },
    ).totalDamage

  it("are direct weapon hits that take no Sustain damage boost", () => {
    const plain = springAway()
    expect(plain).toBeGreaterThan(0)
    expect(springAway({ sustainDamageBoost: 0.5 })).toBe(plain)
  })
})
