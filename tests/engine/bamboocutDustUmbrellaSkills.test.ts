// Scoped to Bamboocut Dust (docs/TESTING.md § "Class scoping"): the class is
// registered, not validated, so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { FPS } from "../../src/engine/timeline"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { classDefinition } from "../../src/definitions/classes/registry"
import { CLASS_SKILL_BOOSTS } from "../../src/data/baseStats/classSkillBoosts"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { ATTUNE } from "../../src/data/skills/ids"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-dust/ids"
import {
  FIRST_THROW,
  FOURTH_THROW,
  SECOND_THROW,
  THIRD_THROW,
} from "../../src/data/skills/bamboocut-dust/throwTimings"
import { windowFramesOf } from "../bamboocutDust"
import { fadingCrimsonMeter } from "../../src/data/classes/bamboocut-dust/meters"
import { testRotation } from "../builtins"

const CLASS = "bamboocutDust"
const HOVER_SECONDS = 2
const HOVER_START_FRAME = 49

function run(skillIds: string[]) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: testRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
  })
}

const framesOf = (result: ReturnType<typeof run>, skillName: string) =>
  result
    .timeline!.filter((event) => event.skillName === skillName && event.damage > 0)
    .map((event) => event.frame)

const fadingCrimsonAtStart = (result: ReturnType<typeof run>, castIndex: number) =>
  result.casts![castIndex].meterLevels!.find((level) => level.id === fadingCrimsonMeter.id)!.amount

describe("Dreamwrought Bubbles", () => {
  it("lands its out and back hits 92 and 93 frames after the press and ends 116 frames in", () => {
    const result = run([SKILL.dreamwroughtBubbles, SKILL.cycloneWaltz])
    expect(framesOf(result, "Dreamwrought Bubbles")).toEqual([92, 93])
    expect(Math.round(result.casts![1].timeSec * FPS)).toBe(116)
  })

  it("plays 48 and 49 frames in when cast through Fragrant Song - Delicate", () => {
    const result = run([SKILL.dreamwroughtBubblesInstant, SKILL.cycloneWaltz])
    expect(framesOf(result, "Dreamwrought Bubbles (Fragrant Song - Delicate)")).toEqual([48, 49])
    expect(Math.round(result.casts![1].timeSec * FPS)).toBe(72)
  })

  it("receives the 20% non-player factor but none of the Martial Art Skill buffs", () => {
    const hold = builtinSkillsForClass(CLASS).find(
      (skill) => skill.id === SKILL.dreamwroughtBubbles,
    )!
    expect(hold.receives).toContain(BUFF.nonPlayerBaseDamage20)
    expect(hold.receives).not.toContain(BUFF.fragrantSong)
    expect(hold.receives).not.toContain(BUFF.returningUmbrellaDamage)
  })
})

describe("Cyclone Waltz", () => {
  it("hits eleven times: nine ticks every 18 frames from frame 42, then two finishes", () => {
    const result = run([SKILL.cycloneWaltz])
    const ticks = framesOf(result, "Cyclone Waltz")
    const finishes = framesOf(result, "Cyclone Waltz (Finish)")
    expect(ticks).toEqual([42, 60, 78, 96, 114, 132, 150, 168, 186])
    expect(finishes).toEqual([186, 204])
  })

  it("opens the Awareness gate on frame 42 and closes it on frame 198", () => {
    const result = run([SKILL.cycloneWaltz])
    const [window] = windowFramesOf(result, STATUS.cycloneAwareness)
    expect(window).toEqual({ start: 42, end: 198 })
  })

  it("allows the recast only while Awareness is up", () => {
    expect(run([SKILL.cycloneWaltzRecast]).invalidStepIds).toHaveLength(1)
    expect(run([SKILL.cycloneWaltz, SKILL.cycloneWaltzRecast]).invalidStepIds).toHaveLength(1)
    expect(
      run([SKILL.cycloneWaltzRecastForm, SKILL.cycloneWaltzRecast]).invalidStepIds ?? [],
    ).toEqual([])
  })

  it("keeps eleven hits worth 1.221 in total when the recast cuts the spin, and ends on frame 226", () => {
    const result = run([
      SKILL.cycloneWaltzRecastForm,
      SKILL.cycloneWaltzRecast,
      SKILL.umbrellaLightAttack,
    ])
    expect(framesOf(result, "Cyclone Waltz (Recast Form)")).toEqual([
      42, 60, 78, 96, 114, 132, 150, 168, 186,
    ])
    expect(framesOf(result, "Cyclone Waltz (Recast Form, Finish)")).toEqual([186])
    expect(framesOf(result, "Cyclone Waltz (Recast)")).toEqual([187 + 14])
    expect(Math.round(result.casts![1].timeSec * FPS)).toBe(187)
    expect(Math.round(result.casts![2].timeSec * FPS)).toBe(187 + 39)
  })

  it("leaves the Special Skill attunement off the recast", () => {
    const skills = builtinSkillsForClass(CLASS)
    const recast = skills.find((skill) => skill.id === SKILL.cycloneWaltzRecast)!
    expect(recast.tags).not.toContain(ATTUNE.everspringSpecial)
  })

  it("tags only the ticks with the Special Skill attunement", () => {
    const skills = builtinSkillsForClass(CLASS)
    const ticks = skills.find((skill) => skill.id === SKILL.cycloneWaltz)!
    const finish = skills.find((skill) => skill.id === SKILL.cycloneWaltzFinish)!
    expect(ticks.tags).toContain(ATTUNE.everspringSpecial)
    expect(finish.tags).not.toContain(ATTUNE.everspringSpecial)
  })
})

describe("the umbrella's basic attacks", () => {
  it("lands the light chain on its four melee hits", () => {
    const result = run([SKILL.umbrellaLightAttack])
    expect(framesOf(result, "Umbrella - Light Attack (3-stage)")).toEqual([1, 29, 67, 105])
  })

  it("lands the heavy chain stages on their collider frames", () => {
    const stage = (id: string, name: string) => framesOf(run([id]), name)
    expect(stage(SKILL.heavyAttack1, "Umbrella - Heavy Attack (1st stage)")).toEqual([6])
    expect(stage(SKILL.heavyAttack2, "Umbrella - Heavy Attack (2nd stage)")).toEqual([8, 37])
    expect(stage(SKILL.heavyAttack3, "Umbrella - Heavy Attack (3rd stage)")).toHaveLength(3)
    expect(stage(SKILL.heavyAttack4, "Umbrella - Heavy Attack (4th stage)")).toEqual([12])
  })

  it("launches the dash projectile from the second collider and refunds 4 Fading Crimson on it", () => {
    const result = run([SKILL.scarletSpin, SKILL.umbrellaDash, SKILL.umbrellaLightAttack])
    const bullet = framesOf(result, "Umbrella - Dash (Projectile)")
    expect(bullet).toHaveLength(1)
    expect(bullet[0]).toBeGreaterThan(68 + 51)
    expect(fadingCrimsonAtStart(result, 2)).toBe(79)
  })

  it("lifts for 4 Fading Crimson and then fires twelve level-one projectiles in Spring Away", () => {
    const result = run([SKILL.scarletSpin, SKILL.springAway, SKILL.cycloneWaltz])
    expect(framesOf(result, "Spring Away (Lift)")).toEqual([68 + 29])
    expect(framesOf(result, "Spring Away")).toHaveLength(12)
    expect(fadingCrimsonAtStart(result, 2)).toBe(79)
  })

  it("lands every Spring Away projectile inside the two-second hover", () => {
    const result = run([SKILL.springAway])
    const hoverStart = HOVER_START_FRAME
    for (const frame of framesOf(result, "Spring Away")) {
      expect(frame).toBeGreaterThanOrEqual(hoverStart)
      expect(frame).toBeLessThanOrEqual(hoverStart + HOVER_SECONDS * FPS)
    }
  })

  it("drains 10 Endurance a second over the two-second hover of Spring Away", () => {
    const result = run([SKILL.springAway, SKILL.springAway])
    const endurance = result.casts![1].meterLevels!.find((level) => level.id === "endurance")!
    const drained = 10 * HOVER_SECONDS
    const regeneratedAfterRelease = ((200 - HOVER_START_FRAME - HOVER_SECONDS * FPS) / FPS) * 10
    expect(endurance.amount).toBeCloseTo(endurance.capacity - drained + regeneratedAfterRelease, 1)
  })

  it("lands the Dual-Weapon Skill on its collider and its second volley", () => {
    const result = run([SKILL.umbrellaDual])
    expect(framesOf(result, "Umbrella (Dual-Weapon Skill)")).toEqual([23, 33])
  })

  it("fires the Spring Away projectiles from frame 57 every 9.8 frames", () => {
    const frames = framesOf(run([SKILL.springAway]), "Spring Away")
    expect(frames).toEqual(Array.from({ length: 12 }, (_, index) => 57 + Math.round(9.8 * index)))
  })

  it("lands the dash projectile on the render frame after its 56.3 frame flight against a target at 3 m", () => {
    const result = run([SKILL.umbrellaDash])
    expect(framesOf(result, "Umbrella - Dash (Projectile)")).toEqual([57])
  })

  it("ends a cancelled recovery after 12 frames", () => {
    const result = run([SKILL.deflectCancel, SKILL.cycloneWaltz])
    expect(Math.round(result.casts![1].timeSec * FPS)).toBe(12)
  })
})

describe("the summon resonance frames", () => {
  it("follows each far point on the in-game frames, with and without Fragrant Song", () => {
    const resonanceFrames = (timing: typeof FIRST_THROW, variant: "normal" | "fragrant") =>
      timing[variant].outFrame + timing[variant].resonanceDelayFrames
    const throws = [FIRST_THROW, SECOND_THROW, THIRD_THROW, FOURTH_THROW]
    expect(throws.map((timing) => resonanceFrames(timing, "normal"))).toEqual([59, 50, 60, 53])
    expect(throws.map((timing) => resonanceFrames(timing, "fragrant"))).toEqual([45, 38, 46, 41])
  })
})

describe("Bamboocut Dust registration", () => {
  it("carries the talent panel rows of both arts", () => {
    const skills = CLASS_SKILL_BOOSTS.bamboocutDust.map((row) => row.skill)
    expect(skills).toEqual([
      "Critical Rate UP",
      "Physical Attack UP",
      "Umbrella Bamboocut Attack Min",
      "Umbrella Bamboocut Attack Max",
      "Rope Dart Bamboocut Attack Min",
      "Rope Dart Bamboocut Attack Max",
      "Bamboocut Penetration Scale",
      "Attribute Damage Scale",
    ])
  })

  it("offers the five attunement lines that can roll and none for the charged umbrella skill", () => {
    const definition = classDefinition(CLASS)!
    expect(definition.attunements.map((option) => option.id)).toEqual(
      expect.arrayContaining([
        "everspringMartialArt",
        "everspringSpecial",
        "unfetteredMartialArt",
        "unfetteredCharged",
        "unfetteredSpecial",
      ]),
    )
    expect(definition.classSpecificAttunements).toHaveLength(5)
    expect(definition.attunements.map((option) => option.id)).not.toContain("everspringCharged")
  })

  it("places every hit on a whole frame inside its cast", () => {
    for (const skill of builtinSkillsForClass(CLASS)) {
      if (skill.id.startsWith("universal") || !skill.id.startsWith(`${CLASS}-`)) continue
      if (skill.castFrames === 0) continue
      for (const hit of skill.hits) {
        expect(Number.isInteger(hit.frame), `${skill.id} ${hit.id}`).toBe(true)
        expect(hit.frame, `${skill.id} ${hit.id}`).toBeLessThan(skill.castFrames)
        for (const variant of hit.variants ?? []) {
          if (variant.frame !== undefined) {
            expect(Number.isInteger(variant.frame), `${skill.id} ${hit.id}`).toBe(true)
            expect(variant.frame, `${skill.id} ${hit.id} variant`).toBeLessThan(
              variant.castFrames ?? skill.castFrames,
            )
          }
        }
      }
    }
  })
})
