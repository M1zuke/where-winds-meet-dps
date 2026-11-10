// Scoped to Silkbind Jade's light-attack and dash modules; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { blossomResource } from "../../src/data/classes/silkbind-jade/blossoms"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { CAST, WEAPON } from "../../src/data/skills/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { builtinSkill } from "../builtins"

const jadeSkill = (skillId: string) => builtinSkill("silkbindJade", skillId)

const hitValues = (skillId: string) =>
  jadeSkill(skillId).hits.map((skillHit) => [
    skillHit.frame,
    skillHit.physMultiplier,
    skillHit.attributeMultiplier,
    skillHit.physFixed,
    skillHit.attributeFixed,
  ])

describe.each([
  [SKILL.umbrellaDash, CAST.umbrellaDash, "Umbrella - Dash", 88],
  [SKILL.umbrellaDashBullet, CAST.umbrellaDashBullet, "Umbrella - Dash (Bullet)", 0],
  [SKILL.fanLight, CAST.fanLight, "Fan - Light Attack", 37],
  [SKILL.fanLightChain, CAST.fanLightChain, "Fan - Light Attack (4-stage)", 150],
  [SKILL.fanDash, CAST.fanDash, "Fan - Dash", 63],
])("%s", (skillId, castTag, name, castFrames) => {
  it("is a triggerable Silkbind weapon skill with its own cast tag", () => {
    const skill = jadeSkill(skillId)
    expect(skill).toMatchObject({
      name,
      castTag,
      castFrames,
      skillType: "weapon",
      attributeAttack: "Silkbind",
      triggerable: true,
    })
  })

  it("appears in no built-in rotation", () => {
    for (const rotation of builtinRotationsForClass("silkbindJade")) {
      expect(rotation.steps.some((step) => step.skillId === skillId)).toBe(false)
    }
  })
})

describe("Umbrella - Dash", () => {
  it("hits twice by collider, then launches its bullet at 30 m/s as its own skill", () => {
    expect(hitValues(SKILL.umbrellaDash)).toEqual([
      [17, 0.439065, 0.6585975, 122, 66.5],
      [51, 0.439065, 0.6585975, 122, 66.5],
    ])
    expect(
      jadeSkill(SKILL.umbrellaDash).hits[1]!.triggers.map((trigger) => trigger.targetId),
    ).toEqual([SKILL.umbrellaDashBullet])
    expect(hitValues(SKILL.umbrellaDashBullet)).toEqual([[0, 0.304656, 0.456984, 84.4, 46.0]])
    expect(jadeSkill(SKILL.umbrellaDashBullet).hits[0]!.projectile).toEqual({
      speedMetersPerSecond: 30,
      maxTravelFrames: 120,
    })
  })

  it("gives the trajectory-tagged bullet the talents the untagged colliders never get", () => {
    const talents = [BUFF.windWall, BUFF.trajectorySkill, BUFF.combo]
    for (const buffId of talents) {
      expect(jadeSkill(SKILL.umbrellaDash).receives).not.toContain(buffId)
      expect(jadeSkill(SKILL.umbrellaDashBullet).receives).toContain(buffId)
    }
    for (const skillId of [SKILL.umbrellaDash, SKILL.umbrellaDashBullet]) {
      expect(jadeSkill(skillId).tags).toEqual([WEAPON.umbrella])
      expect(jadeSkill(skillId).receives).toContain(BUFF.vernalUmbrellaAdditionalAttack)
    }
  })

  it("pays 4 Blossoms on the bullet hit", () => {
    expect(blossomResource.gains.find((rule) => rule.id === "umbrellaDashBullet")).toMatchObject({
      defaultAmount: 4,
      skillIds: [SKILL.umbrellaDashBullet],
    })
  })
})

describe("Fan light attacks", () => {
  it("taps stage 1 only, landing as the 80 m/s bullet at maximum distance", () => {
    expect(hitValues(SKILL.fanLight)).toEqual([[31.8, 0.408064, 0.612096, 113, 61.6]])
    expect(jadeSkill(SKILL.fanLight).hits[0]!.projectile).toEqual({
      speedMetersPerSecond: 80,
      maxTravelFrames: 12,
    })
  })

  it("splits the 4-stage chain by ratio 0.2 / 0.15 / 0.2 / 0.45", () => {
    expect(hitValues(SKILL.fanLightChain)).toEqual([
      [31.8, 0.408064, 0.612096, 113, 61.6],
      [55, 0.306048, 0.459072, 84.75, 46.2],
      [75, 0.408064, 0.612096, 113, 61.6],
      [103, 0.918144, 1.377216, 254.25, 138.6],
    ])
  })

  it("reaches the light attacks with the umbrella penetration talent and Jadebreak", () => {
    for (const skillId of [SKILL.fanLight, SKILL.fanLightChain]) {
      expect(jadeSkill(skillId).receives).toEqual(
        expect.arrayContaining([BUFF.trajectorySkill, BUFF.windWall]),
      )
    }
    expect(jadeSkill(SKILL.fanDash).receives).not.toContain(BUFF.trajectorySkill)
  })

  it("earns no Blossoms", () => {
    for (const skillId of [SKILL.fanLight, SKILL.fanLightChain, SKILL.fanDash]) {
      const paying = blossomResource.gains.filter(
        (rule) => "skillIds" in rule && (rule.skillIds as readonly string[]).includes(skillId),
      )
      expect(paying).toEqual([])
    }
  })
})

describe("Fan - Dash", () => {
  it("hits at 13, 33, 39 and 60 with ratios 0.3 / 0.3 / 0.3 / 0.4", () => {
    expect(hitValues(SKILL.fanDash)).toEqual([
      [13, 0.301464, 0.452196, 83.7, 45.6],
      [33, 0.301464, 0.452196, 83.7, 45.6],
      [39, 0.301464, 0.452196, 83.7, 45.6],
      [60, 0.401952, 0.602928, 111.6, 60.8],
    ])
  })
})
