import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V22__sharedMysticCoefficients,
  recalibrateSharedMysticHits,
} from "../../src/migrations/customSkills/V22__sharedMysticCoefficients"
import { healSkill as healInGameCoefficientCorrections } from "../../src/migrations/customSkills/V58__inGameCoefficientCorrections"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV21File from "./testCustomSkills/v21/store.json"

const CLASS = "bellstrikeUmbra"
const DRAGON_HEAD_PLUS = "mystic-dragon-head-plus"
const STORE = storeV21File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinDragonHeadPlus = (): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === DRAGON_HEAD_PLUS)!

describe("custom-skills v21 fixture", () => {
  it("is v21 and still stores the superseded Dragon Head - Plus row", () => {
    expect(STORE.v).toBe(V22__sharedMysticCoefficients.to - 1)
    const hit = skillIn(STORE, DRAGON_HEAD_PLUS).hits[0]
    expect(hit.physMultiplier).toBe(17.34049)
    expect(hit.attributeMultiplier).toBe(26.010735)
    expect(hit.physFixed).toBe(2608.52)
  })

  it("stores a row the built-in no longer carries", () => {
    expect(builtinDragonHeadPlus().hits[0].physMultiplier).not.toBe(17.34049)
  })
})

describe("recalibrateSharedMysticHits", () => {
  it("rewrites an untouched Dragon Head - Plus row to the in-game values", () => {
    const [healed] = recalibrateSharedMysticHits(
      DRAGON_HEAD_PLUS,
      clone(skillIn(STORE, DRAGON_HEAD_PLUS).hits),
    ) as Skill["hits"]
    expect(healed.physMultiplier).toBe(builtinDragonHeadPlus().hits[0].physMultiplier)
    expect(healed.attributeMultiplier).toBe(builtinDragonHeadPlus().hits[0].attributeMultiplier)
    expect(healed.physFixed).toBe(builtinDragonHeadPlus().hits[0].physFixed)
  })

  it("rewrites an untouched Dragon Head, Smolder 1-Hit and Smolder 2-Hits row", () => {
    const dragonHeadId = "mystic-dragon-head"
    const [dragonHead] = recalibrateSharedMysticHits(
      dragonHeadId,
      clone(skillIn(STORE, dragonHeadId).hits),
    ) as Skill["hits"]
    const builtinDragonHead = builtinSkillsForClass(CLASS).find(
      (skill) => skill.id === dragonHeadId,
    )!
    expect(dragonHead.physMultiplier).toBe(builtinDragonHead.hits[0].physMultiplier)
    expect(dragonHead.attributeMultiplier).toBe(builtinDragonHead.hits[0].attributeMultiplier)
    expect(dragonHead.physFixed).toBe(builtinDragonHead.hits[0].physFixed)

    const smolder1Id = "mystic-dragon-fire-smolder-1-hit"
    const [smolder1] = recalibrateSharedMysticHits(
      smolder1Id,
      clone(skillIn(STORE, smolder1Id).hits),
    ) as Skill["hits"]
    const builtinSmolder1 = builtinSkillsForClass(CLASS).find((skill) => skill.id === smolder1Id)!
    expect(smolder1.physMultiplier).toBe(builtinSmolder1.hits[0].physMultiplier)
    expect(smolder1.attributeMultiplier).toBe(builtinSmolder1.hits[0].attributeMultiplier)
    expect(smolder1.physFixed).toBe(builtinSmolder1.hits[0].physFixed)

    const smolder2Id = "mystic-dragon-fire-smolder-2-hits"
    const smolder2Hits = (
      healInGameCoefficientCorrections({
        id: smolder2Id,
        hits: recalibrateSharedMysticHits(smolder2Id, clone(skillIn(STORE, smolder2Id).hits)),
      }) as Skill
    ).hits
    const builtinSmolder2 = builtinSkillsForClass(CLASS).find((skill) => skill.id === smolder2Id)!
    smolder2Hits.forEach((healedHit, index) => {
      expect(healedHit.physMultiplier).toBe(builtinSmolder2.hits[index].physMultiplier)
      expect(healedHit.attributeMultiplier).toBe(builtinSmolder2.hits[index].attributeMultiplier)
      expect(healedHit.physFixed).toBe(builtinSmolder2.hits[index].physFixed)
    })

    const bitterSeasonId = "bellstrikeUmbra-bitter-season-tick"
    const [bitterSeason] = recalibrateSharedMysticHits(
      bitterSeasonId,
      clone(skillIn(STORE, bitterSeasonId).hits),
    ) as Skill["hits"]
    const builtinBitterSeason = builtinSkillsForClass(CLASS).find(
      (skill) => skill.id === bitterSeasonId,
    )!
    expect(bitterSeason.physMultiplier).toBe(builtinBitterSeason.hits[0].physMultiplier)
    expect(bitterSeason.attributeMultiplier).toBe(builtinBitterSeason.hits[0].attributeMultiplier)
    expect(bitterSeason.physFixed).toBe(builtinBitterSeason.hits[0].physFixed)
  })

  it("leaves an edited row and a skill with another id alone", () => {
    const edited = clone(skillIn(STORE, DRAGON_HEAD_PLUS).hits)
    edited[0].physMultiplier = 30
    expect(recalibrateSharedMysticHits(DRAGON_HEAD_PLUS, edited)).toEqual(edited)
    const other = clone(skillIn(STORE, "bellstrikeUmbra-swordq").hits)
    expect(recalibrateSharedMysticHits("bellstrikeUmbra-swordq", other)).toEqual(other)
  })
})

const RECALIBRATED_IDS = [
  DRAGON_HEAD_PLUS,
  "mystic-dragon-head",
  "mystic-dragon-fire-smolder-1-hit",
  "mystic-dragon-fire-smolder-2-hits",
  "bellstrikeUmbra-bitter-season-tick",
]

describe("V22__sharedMysticCoefficients — called directly", () => {
  it("rewrites every untouched seeded copy and nothing else", () => {
    const before = clone(STORE)
    const after = V22__sharedMysticCoefficients.migrate(before)
    expect(after.v).toBe(22)
    for (const id of RECALIBRATED_IDS) {
      const builtin = builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!
      const healedHits = (healInGameCoefficientCorrections(skillIn(after, id)) as Skill).hits
      healedHits.forEach((healedHit, index) => {
        expect(healedHit.physMultiplier, id).toBe(builtin.hits[index].physMultiplier)
        expect(healedHit.attributeMultiplier, id).toBe(builtin.hits[index].attributeMultiplier)
        expect(healedHit.physFixed, id).toBe(builtin.hits[index].physFixed)
      })
      const { hits: _beforeHits, ...restBefore } = skillIn(STORE, id)
      const { hits: _afterHits, ...restAfter } = skillIn(after, id)
      void _beforeHits
      void _afterHits
      expect(restAfter, id).toEqual(restBefore)
    }
    for (const skill of STORE.skills) {
      if (RECALIBRATED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V22__sharedMysticCoefficients.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V22__sharedMysticCoefficients.migrate(clone(once))).toEqual(once)
  })
})

describe("V22__sharedMysticCoefficients — through the chain", () => {
  it("is registered and is exactly what the v21 → v22 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V22__sharedMysticCoefficients)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 22 })!
    expect(result.applied).toEqual(["V22__sharedMysticCoefficients"])
    expect(result.blob.v).toBe(22)
    expect(skillIn(result.blob, DRAGON_HEAD_PLUS).hits[0].physMultiplier).toBe(
      builtinDragonHeadPlus().hits[0].physMultiplier,
    )
  })
})
