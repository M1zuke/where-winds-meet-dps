import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import { loadCustomSkills } from "../../src/storage"
import {
  LATEST_CUSTOM_SKILLS_VERSION,
  migrateNeverAbradesSkill,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { healBleedRowDefaults } from "../../src/migrations/customSkills/V6__bleedRowDefaults"
import { healMysticArtRank } from "../../src/migrations/customSkills/V7__mysticArtRankRepair"
import { healRiverFlowApplication } from "../../src/migrations/customSkills/V8__riverFlowAppliesOnCastEnd"
import { healBleedCoefficientReach } from "../../src/migrations/customSkills/V9__bleedCoefficientReach"
import { healWolfchasersArtSwordOverreach } from "../../src/migrations/customSkills/V10__wolfchasersArtSwordOverreach"
import { healSpearMistwillowReach } from "../../src/migrations/customSkills/V11__spearMistwillowReach"
import { healDragonHeadLowHpReach } from "../../src/migrations/customSkills/V12__dragonHeadLowHpReach"
import { healSpearHeavyChargedCoefficients } from "../../src/migrations/customSkills/V13__spearHeavyChargedCoefficients"
import { healBellstrikeUmbraArtBonusAttack } from "../../src/migrations/customSkills/V16__bellstrikeUmbraArtBonusAttack"
import { healBellstrikeSplendorArtBonusAttack } from "../../src/migrations/customSkills/V17__bellstrikeSplendorArtBonusAttack"
import { healStonesplitStrengthArtBonusAttack } from "../../src/migrations/customSkills/V18__stonesplitStrengthArtBonusAttack"
import { healBamboocutDraughtArtBonusAttack } from "../../src/migrations/customSkills/V19__bamboocutDraughtArtBonusAttack"
import { healSilkbindJadeArtBonusAttack } from "../../src/migrations/customSkills/V20__silkbindJadeArtBonusAttack"
import { healJadeBlossomBarrageReach } from "../../src/migrations/customSkills/V21__jadeBlossomBarrageReach"
import { recalibrateSharedMysticHits } from "../../src/migrations/customSkills/V22__sharedMysticCoefficients"
import {
  addDrunkenHazeExplosionHits,
  addFinalStrikeExplosionTrigger,
} from "../../src/migrations/customSkills/V23__drunkenHazeExplosion"
import { healSkill as healUmbraValueFixes } from "../../src/migrations/customSkills/V24__umbraValueFixes"
import { healBamboocutDraughtValuesGatesReach } from "../../src/migrations/customSkills/V25__bamboocutDraughtValuesGatesReach"
import { healStonesplitStrengthValuesGatesReach } from "../../src/migrations/customSkills/V26__stonesplitStrengthValuesGatesReach"
import { healBellstrikeSplendorValuesGatesReach } from "../../src/migrations/customSkills/V27__bellstrikeSplendorValuesGatesReach"
import { healSilkbindJadeValuesGatesReach } from "../../src/migrations/customSkills/V28__silkbindJadeValuesGatesReach"
import { healSkill as healSoberSorrowExtendParam } from "../../src/migrations/customSkills/V29__soberSorrowExtendUsesParam"
import { healSkill as healSwordSpecial4HitAttunementReach } from "../../src/migrations/customSkills/V30__swordSpecial4HitAttunementReach"
import { healSkill as healForgetfulnessCooldownMarker } from "../../src/migrations/customSkills/V31__forgetfulnessCooldownMarker"
import { healSkill as healSnowbreakSpringAvailability } from "../../src/migrations/customSkills/V32__snowbreakSpringAvailability"
import { healSkill as healSnowbreakSpringGrantTiming } from "../../src/migrations/customSkills/V33__snowbreakSpringGrantTiming"
import { healSkill as healHerosBloodInebriateConditionalNoAbrasion } from "../../src/migrations/customSkills/V34__herosBloodInebriateConditionalNoAbrasion"
import { healSkill as healSwordHorizonCrisscrossGates } from "../../src/migrations/customSkills/V35__swordHorizonCrisscrossGates"
import { healSkill as healSwordMorphMultiWaveWindow } from "../../src/migrations/customSkills/V36__swordMorphMultiWaveWindow"
import { healSkill as healAnxiSoldierHengSnowbreakTag } from "../../src/migrations/customSkills/V37__anxiSoldierHengSnowbreakTag"
import { healSkill as healMeterFieldsAndGains } from "../../src/migrations/customSkills/V38__meterFieldsAndGains"
import { healSkill as healMeterModifierGains } from "../../src/migrations/customSkills/V39__meterModifierGains"
import { healSkill as healMountainsMightAndQiImbalanceMarker } from "../../src/migrations/customSkills/V40__mountainsMightAndQiImbalanceMarker"
import { healSkill as healTargetDistanceReachAndDisplacement } from "../../src/migrations/customSkills/V44__targetDistanceReachAndDisplacement"
import { healSkillFrames as healCastLengthAndHitFrameRepairs } from "../../src/migrations/customSkills/V45__castLengthAndHitFrameRepairs"
import { healSkillFrames as healStonesplitSplendorJadeTimingRepairs } from "../../src/migrations/customSkills/V46__stonesplitSplendorJadeTimingRepairs"
import { healSkill as healPerGrantSiteDelayAndSetReach } from "../../src/migrations/customSkills/V49__perGrantSiteDelayAndSetReach"
import { healSkill as healEtherwrathPenetrationReach } from "../../src/migrations/customSkills/V50__etherwrathPenetrationReach"
import { healSkill as healRelentlessChaseSecondStrike } from "../../src/migrations/customSkills/V51__relentlessChaseSecondStrike"
import { healSkill as healGourdTossThunder } from "../../src/migrations/customSkills/V52__gourdTossThunder"
import { healSkill as healGourdTossFlyingTornado } from "../../src/migrations/customSkills/V53__gourdTossFlyingTornado"
import { healSkill as healSwallowcallColorfulPhoenixReach } from "../../src/migrations/customSkills/V54__swallowcallColorfulPhoenixReach"
import { healSkill as healPoetSecondCollider } from "../../src/migrations/customSkills/V56__poetSecondCollider"
import { healSkill as healNightwickFollowUpCancelledByNextSkill } from "../../src/migrations/customSkills/V57__nightwickFollowUpCancelledByNextSkill"
import { healSkill as healInGameCoefficientCorrections } from "../../src/migrations/customSkills/V58__inGameCoefficientCorrections"
import { healSkill as healSpringlessSilenceLandingHitOnly } from "../../src/migrations/customSkills/V60__springlessSilenceLandingHitOnly"
import { healSkill as healBoundvesselSpringAwayToadAfterimageTiming } from "../../src/migrations/customSkills/V61__boundvesselSpringAwayToadAfterimageTiming"
import { healSkill as healShadowStepDashWindow } from "../../src/migrations/customSkills/V62__shadowStepDashWindow"
import { healSkill as healBoundvesselDrinkAccumulation } from "../../src/migrations/customSkills/V63__boundvesselDrinkAccumulation"
import { healSkill as healInGameTimingCorrections } from "../../src/migrations/customSkills/V64__inGameTimingCorrections"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { MYSTIC_ARTS_CLASS_ID, type Skill } from "../../src/engine/skill"
import { migrateMysticId } from "../../src/migrations"

function healSharedMysticCoefficients(skill: unknown): unknown {
  if (!skill || typeof skill !== "object" || typeof (skill as Skill).id !== "string") return skill
  const { id, hits } = skill as Skill
  return { ...skill, hits: recalibrateSharedMysticHits(id, hits) }
}

function healDrunkenHazeExplosion(skill: unknown): unknown {
  if (!skill || typeof skill !== "object" || typeof (skill as Skill).id !== "string") return skill
  const { id, hits } = skill as Skill
  return {
    ...skill,
    hits: addFinalStrikeExplosionTrigger(id, addDrunkenHazeExplosionHits(id, hits)),
  }
}

const HEALS_BY_STEP: readonly [number, (skill: unknown) => unknown][] = [
  [6, healBleedRowDefaults],
  [7, healMysticArtRank],
  [8, healRiverFlowApplication],
  [9, healBleedCoefficientReach],
  [10, healWolfchasersArtSwordOverreach],
  [11, healSpearMistwillowReach],
  [12, healDragonHeadLowHpReach],
  [13, healSpearHeavyChargedCoefficients],
  [16, healBellstrikeUmbraArtBonusAttack],
  [17, healBellstrikeSplendorArtBonusAttack],
  [18, healStonesplitStrengthArtBonusAttack],
  [19, healBamboocutDraughtArtBonusAttack],
  [20, healSilkbindJadeArtBonusAttack],
  [21, healJadeBlossomBarrageReach],
  [22, healSharedMysticCoefficients],
  [23, healDrunkenHazeExplosion],
  [24, healUmbraValueFixes],
  [25, healBamboocutDraughtValuesGatesReach],
  [26, healStonesplitStrengthValuesGatesReach],
  [27, healBellstrikeSplendorValuesGatesReach],
  [28, healSilkbindJadeValuesGatesReach],
  [29, healSoberSorrowExtendParam],
  [30, healSwordSpecial4HitAttunementReach],
  [31, healForgetfulnessCooldownMarker],
  [32, healSnowbreakSpringAvailability],
  [33, healSnowbreakSpringGrantTiming],
  [34, healHerosBloodInebriateConditionalNoAbrasion],
  [35, healSwordHorizonCrisscrossGates],
  [36, healSwordMorphMultiWaveWindow],
  [37, healAnxiSoldierHengSnowbreakTag],
  [38, healMeterFieldsAndGains],
  [39, healMeterModifierGains],
  [40, healMountainsMightAndQiImbalanceMarker],
  [44, healTargetDistanceReachAndDisplacement],
  [45, healCastLengthAndHitFrameRepairs],
  [46, healStonesplitSplendorJadeTimingRepairs],
  [49, healPerGrantSiteDelayAndSetReach],
  [50, healEtherwrathPenetrationReach],
  [51, healRelentlessChaseSecondStrike],
  [52, healGourdTossThunder],
  [53, healGourdTossFlyingTornado],
  [54, healSwallowcallColorfulPhoenixReach],
  [56, healPoetSecondCollider],
  [57, healNightwickFollowUpCancelledByNextSkill],
  [58, healInGameCoefficientCorrections],
  [60, healSpringlessSilenceLandingHitOnly],
  [61, healBoundvesselSpringAwayToadAfterimageTiming],
  [62, healShadowStepDashWindow],
  [63, healBoundvesselDrinkAccumulation],
  [64, healInGameTimingCorrections],
]

const SKILLS_KEY = "wwm.customSkills"
const ROOT = join(process.cwd(), "tests/migrations/testCustomSkills")
const CLASS = "bellstrikeUmbra"

type StoreFile = { v: number; skills: Skill[] }
type Fixture = { version: number; blob: StoreFile }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function allFixtures(): Fixture[] {
  return readdirSync(ROOT)
    .filter((entry) => statSync(join(ROOT, entry)).isDirectory())
    .map((folder) => ({
      version: Number(folder.slice(1)),
      blob: JSON.parse(readFileSync(join(ROOT, folder, "store.json"), "utf8")) as Fixture["blob"],
    }))
    .sort((left, right) => left.version - right.version)
}

const FIXTURES = allFixtures()
const OLDEST = FIXTURES[0]

const cases = (list: Fixture[]): [string, Fixture][] =>
  list.map((fixture) => [`v${fixture.version}`, fixture])

const rowOf = (hit: Skill["hits"][number]) => [
  hit.physMultiplier,
  hit.attributeMultiplier,
  hit.physFixed,
  hit.attributeFixed,
]

const walkedIdentities = (skills: Skill[]): Pick<Skill, "id" | "classId">[] => {
  const stored = new Set(skills.map((skill) => skill.id))
  const claimed = new Set<string>()
  return skills.map((skill) => {
    const id = migrateMysticId(skill.id)
    if (id === skill.id || stored.has(id) || claimed.has(id)) {
      return { id: skill.id, classId: skill.classId }
    }
    claimed.add(id)
    return { id, classId: MYSTIC_ARTS_CLASS_ID }
  })
}

describe("every captured custom-skill store walks the whole chain", () => {
  it.each(cases(FIXTURES))(
    "%s lands at the latest version with every skill kept",
    (_name, fixture) => {
      const result = runCustomSkillMigrations(clone(fixture.blob))!
      expect(result.blob.v).toBe(LATEST_CUSTOM_SKILLS_VERSION)
      expect((result.blob.skills as Skill[]).map((skill) => skill.id)).toEqual(
        walkedIdentities(fixture.blob.skills).map((identity) => identity.id),
      )
    },
  )

  it.each(cases(FIXTURES))(
    "%s keeps every field a step does not claim across every hop",
    (_name, fixture) => {
      const result = runCustomSkillMigrations(clone(fixture.blob))!
      const strip = (skill: Skill) => ({
        ...skill,
        hits: skill.hits.map(({ id, frame }) => ({ id, frame })),
      })
      const identities = walkedIdentities(fixture.blob.skills)
      const stepsAbove = (version: number) =>
        HEALS_BY_STEP.filter(([to]) => version < to).map(([, heal]) => heal)
      ;(result.blob.skills as Skill[]).forEach((walked, index) => {
        const healed = stepsAbove(fixture.version).reduce(
          (skill, heal) => heal(skill) as Skill,
          clone(fixture.blob.skills[index]),
        )
        const identified = { ...healed, ...identities[index] }
        const expected = (
          fixture.version < 15 ? migrateNeverAbradesSkill(identified) : identified
        ) as Skill
        expect(strip(walked)).toEqual(strip(expected))
      })
    },
  )
})

describe("the oldest custom-skill store survives loadCustomSkills end to end", () => {
  beforeEach(() => localStorage.clear())

  it("is persisted once at the latest version with every seeded copy on the built-in's current rows", () => {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(OLDEST.blob))
    const loaded = loadCustomSkills()
    const identities = walkedIdentities(OLDEST.blob.skills)
    expect(loaded.map((skill) => skill.id)).toEqual(identities.map((identity) => identity.id))

    const persisted = JSON.parse(localStorage.getItem(SKILLS_KEY)!) as RawCustomSkillsBlob
    expect(persisted.v).toBe(LATEST_CUSTOM_SKILLS_VERSION)

    for (const skill of loaded) {
      const builtin = builtinSkillsForClass(CLASS).find((candidate) => candidate.id === skill.id)
      const stored =
        OLDEST.blob.skills[identities.findIndex((identity) => identity.id === skill.id)]
      const edited = stored.hits.some(
        (hit, index) =>
          hit.physMultiplier === 0.6 && builtin && builtin.hits[index].physMultiplier !== 0.6,
      )
      const reshaped = builtin && stored.hits.length !== builtin.hits.length
      if (!builtin || edited || reshaped) {
        stored.hits.forEach((hit, index) => expect(rowOf(skill.hits[index])).toEqual(rowOf(hit)))
      } else {
        builtin.hits.forEach((hit, index) =>
          expect(rowOf(skill.hits[index]), skill.id).toEqual(rowOf(hit)),
        )
      }
    }
  })

  it("loads the same on a second load — the walk ran once", () => {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(OLDEST.blob))
    const once = loadCustomSkills()
    const written = localStorage.getItem(SKILLS_KEY)
    expect(loadCustomSkills()).toEqual(once)
    expect(localStorage.getItem(SKILLS_KEY)).toBe(written)
  })
})
