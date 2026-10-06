// Scoped to the perfect-dodge afterimage's wiring; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill, testRotation } from "../builtins"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"
import { SKILL as BAMBOOCUT_SKILL } from "../../src/data/skills/bamboocut-draught/ids"

const AFTERIMAGE_DELAY_FRAMES = 48

const opener = (classId: string): Skill =>
  makeSkill(classId, {
    id: "afterimageOpener",
    name: "Opener",
    castFrames: 6,
    hits: [makeHit({ frame: 0, physMultiplier: 1, attributeMultiplier: 1 })],
  })

const idleFor = (classId: string, castFrames: number): Skill =>
  makeSkill(classId, {
    id: `afterimageIdle${castFrames}`,
    name: `Idle ${castFrames}`,
    castFrames,
    hits: [makeHit({ frame: castFrames, physMultiplier: 1, attributeMultiplier: 1 })],
  })

function run(classId: string, steps: string[], overrides: Partial<Inputs> = {}) {
  const customSkills = [
    opener(classId),
    idleFor(classId, 10),
    idleFor(classId, 100),
    idleFor(classId, 2000),
  ]
  const resolve = (step: string) =>
    customSkills.find((skill) => skill.name === step)?.id ?? builtinSkill(classId, step).id
  return simulateTimeline({
    ...defaultInputs,
    classId,
    customSkills,
    activeCustomRotation: testRotation(classId, {
      steps: steps.map((step) => makeStep({ skillId: resolve(step) })),
    }),
    ...overrides,
  })
}

const afterimageEvents = (classId: string, result: ReturnType<typeof run>) =>
  (result.timeline ?? []).filter(
    (event) => event.skillName === builtinSkill(classId, MYSTIC_SKILL.ghostlyAfterimage).name,
  )

const dodgeFrames = (result: ReturnType<typeof run>, name: string) =>
  (result.timeline ?? []).filter((event) => event.skillName === name).map((event) => event.frame)

const UMBRA = UNIVERSAL_SKILL.ghostlyStepsUmbra
const PLAIN = UNIVERSAL_SKILL.ghostlySteps
const DODGE = UNIVERSAL_SKILL.perfectDodge

describe("the Ghostly Steps - Umbra afterimage", () => {
  it("lands once, 48 frames after the perfect dodge, while Mirage and the Umbra marker are up", () => {
    const result = run("bellstrikeUmbra", [UMBRA, "Opener", DODGE, "Idle 2000"])
    const [dodgeFrame] = dodgeFrames(result, "Perfect Dodge")
    const events = afterimageEvents("bellstrikeUmbra", result)
    expect(events.map((event) => event.frame)).toEqual([dodgeFrame! + AFTERIMAGE_DELAY_FRAMES])
    expect(events[0]!.damage).toBeGreaterThan(0)
  })

  it("lands after the full-length perfect dodge as well", () => {
    const result = run("bellstrikeUmbra", [
      UMBRA,
      "Opener",
      UNIVERSAL_SKILL.perfectDodgeFull,
      "Idle 2000",
    ])
    expect(afterimageEvents("bellstrikeUmbra", result)).toHaveLength(1)
  })

  it("lands after both Bamboocut Draught perfect dodges", () => {
    for (const dodge of [BAMBOOCUT_SKILL.perfectDodge, BAMBOOCUT_SKILL.perfectDodgeFull]) {
      const result = run("bamboocutDraught", [UMBRA, "Opener", dodge, "Idle 2000"])
      expect(afterimageEvents("bamboocutDraught", result), dodge).toHaveLength(1)
    }
  })

  it("does not land from plain Ghostly Steps, which opens Mirage without the marker", () => {
    const result = run("bellstrikeUmbra", [PLAIN, "Opener", DODGE, "Idle 2000"])
    expect(afterimageEvents("bellstrikeUmbra", result)).toHaveLength(0)
  })

  it("does not land with no Ghostly Steps cast at all", () => {
    const result = run("bellstrikeUmbra", ["Opener", DODGE, "Idle 2000"])
    expect(afterimageEvents("bellstrikeUmbra", result)).toHaveLength(0)
  })

  it("does not land once the 30 second Mirage window has lapsed", () => {
    const result = run("bellstrikeUmbra", [UMBRA, "Opener", "Idle 2000", DODGE, "Idle 2000"])
    expect(afterimageEvents("bellstrikeUmbra", result)).toHaveLength(0)
  })

  it("lands once per perfect dodge when the dodges are at least 48 frames apart", () => {
    const result = run("bellstrikeUmbra", [UMBRA, "Opener", DODGE, "Idle 100", DODGE, "Idle 2000"])
    const dodges = dodgeFrames(result, "Perfect Dodge")
    expect(afterimageEvents("bellstrikeUmbra", result).map((event) => event.frame)).toEqual(
      dodges.map((frame) => frame + AFTERIMAGE_DELAY_FRAMES),
    )
  })

  it("lands one afterimage per perfect dodge even when the dodges are inside 48 frames of each other", () => {
    const result = run("bellstrikeUmbra", [UMBRA, "Opener", DODGE, "Idle 10", DODGE, "Idle 2000"])
    const dodges = dodgeFrames(result, "Perfect Dodge")
    const events = afterimageEvents("bellstrikeUmbra", result)
    expect(dodges[1]! - dodges[0]!).toBeLessThan(AFTERIMAGE_DELAY_FRAMES)
    expect(events.map((event) => event.frame)).toEqual(
      dodges.map((frame) => frame + AFTERIMAGE_DELAY_FRAMES),
    )
    expect(events[1]!.damage).toBe(events[0]!.damage)
  })

  it("takes no mystic category boost", () => {
    const steps = [UMBRA, "Opener", DODGE, "Idle 2000"]
    const base = run("bellstrikeUmbra", steps, { areaMysticBoost: 0, singleMysticBoost: 0 })
    const boosted = run("bellstrikeUmbra", steps, { areaMysticBoost: 0.5, singleMysticBoost: 0.5 })
    expect(afterimageEvents("bellstrikeUmbra", boosted)[0]!.damage).toBe(
      afterimageEvents("bellstrikeUmbra", base)[0]!.damage,
    )
  })

  it("carries the in-game row and a Qi ratio of one", () => {
    const explosion = builtinSkill("bellstrikeUmbra", MYSTIC_SKILL.ghostlyAfterimage)
    expect(explosion.hits).toHaveLength(1)
    expect(explosion.hits[0]).toMatchObject({
      frame: AFTERIMAGE_DELAY_FRAMES,
      physMultiplier: 2.041567,
      attributeMultiplier: 3.062351,
      physFixed: 312,
      attributeFixed: 0,
    })
    expect(explosion.hits[0]!.qiRate ?? 1).toBe(1)
    expect(explosion.tags ?? []).toEqual([])
  })
})
