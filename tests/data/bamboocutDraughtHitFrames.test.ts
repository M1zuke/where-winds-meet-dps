import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { simulateTimeline, FPS } from "../../src/engine/timeline"
import { SKILL } from "../../src/data/skills/bamboocut-draught/ids"

const builtin = (id: string): Skill =>
  builtinSkillsForClass("bamboocutDraught").find((skill) => skill.id === id)!

describe("Bamboocut Draught — gauntlet Q hit frames per form", () => {
  it("lands Castlink on its own frames and Jadeflush Castlink on its own", () => {
    const castlink = builtin("bamboocutDraught-castlink")
    expect(castlink.castFrames).toBe(44)
    expect(castlink.hits.slice(0, 2).map((hit) => hit.frame)).toEqual([21, 34])
    expect(castlink.hits.slice(0, 2).map((hit) => hit.variants![0]!.frame)).toEqual([20, 31])
    expect(castlink.hits.slice(2, 4).map((hit) => hit.frame)).toEqual([43, 73])
  })

  it("grants Castlink's Binge Points on its own keyframe, one per form", () => {
    const castlink = builtin("bamboocutDraught-castlink")
    const grants = castlink.hits.filter((hit) => hit.physMultiplier === 0)
    expect(grants.map((hit) => hit.frame)).toEqual([35, 82])
    for (const grant of grants) {
      expect(grant.triggers.map((trigger) => trigger.targetId)).toEqual([
        "buff-bamboocutDraught-skill-binge-point-accumulation",
        "buff-bamboocutDraught-skill-binge-point-accumulation",
      ])
    }
    expect(
      castlink.hits.filter((hit) => hit.physMultiplier > 0).flatMap((hit) => hit.triggers),
    ).not.toContainEqual(
      expect.objectContaining({ targetId: "buff-bamboocutDraught-skill-binge-point-accumulation" }),
    )
  })

  it("grants Grounddrift's Binge Points on its own keyframe", () => {
    const grounddrift = builtin("bamboocutDraught-nightwick-grounddrift")
    const grant = grounddrift.hits.find((hit) => hit.physMultiplier === 0)!
    expect(grant.frame).toBe(93)
    expect(grounddrift.castFrames).toBe(93)
  })

  it("lands Peakfall on one frame shared by both forms and Jadeflush's second hit after it", () => {
    const peakfall = builtin("bamboocutDraught-peakfall")
    expect(peakfall.hits.map((hit) => hit.frame)).toEqual([20, 34])
    expect(peakfall.hits[0]!.variants![0]!.frame).toBeUndefined()
  })
})

describe("Bamboocut Draught — keyframes that lead by a render frame", () => {
  it("is declared on Hero's Blood alone", () => {
    const flagged = builtinSkillsForClass("bamboocutDraught")
      .filter((skill) => skill.keyframesLeadByRenderFrame)
      .map((skill) => skill.id)
    expect(flagged).toEqual(["bamboocutDraught-heros-blood"])
  })
})

describe("Bamboocut Draught — Hero's Blood ends one render period early", () => {
  const castDurationSec = (averageFps: number, leads: boolean): number => {
    const herosBlood = { ...builtin(SKILL.herosBlood), keyframesLeadByRenderFrame: leads }
    const rotation = makeRotation("bamboocutDraught", {
      steps: [makeStep({ skillId: herosBlood.id })],
      pingMs: 0,
      averageFps,
    })
    return simulateTimeline({
      ...defaultInputs,
      classId: "bamboocutDraught",
      customSkills: [herosBlood],
      activeCustomRotation: rotation,
    }).castDuration
  }

  it.each([30, 60, 144, 250])("shortens the cast by one render period at %s fps", (averageFps) => {
    const shortening = castDurationSec(averageFps, false) - castDurationSec(averageFps, true)
    expect(shortening).toBeCloseTo(1 / averageFps, 10)
  })

  it("casts 45 frames at 60 fps, the declared 46 less one render frame", () => {
    expect(castDurationSec(60, true)).toBeCloseTo(45 / FPS, 10)
  })
})
