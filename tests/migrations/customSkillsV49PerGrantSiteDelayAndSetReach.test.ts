import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V49__perGrantSiteDelayAndSetReach,
  healSkill,
} from "../../src/migrations/customSkills/V49__perGrantSiteDelayAndSetReach"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV48File from "./testCustomSkills/v48/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV48File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const STARWEAVE_SKILL_IDS = [
  "bamboocutDraught-castlink",
  "bamboocutDraught-peakfall-prepull",
  "bamboocutDraught-peakfall",
  "bamboocutDraught-reveldrift-cancel",
  "bamboocutDraught-reveldrift",
  "bellstrikeSplendor-spearq-0-hit-cancel",
  "bellstrikeSplendor-spearq-prepull",
  "bellstrikeSplendor-spearq",
  "bellstrikeSplendor-swordq-2nd",
  "bellstrikeSplendor-swordq",
  "bellstrikeUmbra-spearq-5-hit-cancel",
  "bellstrikeUmbra-spearq",
  "bellstrikeUmbra-sword-martial-qqq",
  "bellstrikeUmbra-swordq-follow-up-1-hit-cancel",
  "bellstrikeUmbra-swordq-follow-up-2-hit-cancel",
  "bellstrikeUmbra-swordq",
  "bellstrikeUmbra-swordqfollowup",
  "silkbindJade-fanq-prepull",
  "silkbindJade-fanq",
  "silkbindJade-fanqcancel",
  "silkbindJade-umbq-prepull",
  "silkbindJade-umbq",
]
const SWALLOWCALL_SKILL_IDS = ["bamboocutDraught-light-attack", "bamboocutDraught-bloombreak"]
const FRAME_IDS = [
  "stonesplitStrength-phalanxspecial",
  "silkbindJade-fanlightcharged",
  "silkbindJade-fanspecial",
]
const REALMPLAY_ID = "bamboocutDraught-realmplay"
const ALL_HEALED_IDS = [
  ...STARWEAVE_SKILL_IDS,
  ...SWALLOWCALL_SKILL_IDS,
  ...FRAME_IDS,
  REALMPLAY_ID,
]

describe("custom-skills v48 fixture", () => {
  it("is v48 and stores the pre-V49 shape for every id this step heals", () => {
    expect(STORE.v).toBe(V49__perGrantSiteDelayAndSetReach.to - 1)
    for (const id of STARWEAVE_SKILL_IDS) {
      expect(skillIn(STORE, id).receives, id).not.toContain("starweaveMartialBoost")
    }
    for (const id of SWALLOWCALL_SKILL_IDS) {
      expect(skillIn(STORE, id).receives, id).not.toContain("swallowcallLightAttackBoost")
    }
    for (const id of FRAME_IDS) {
      expect(skillIn(STORE, id).triggersBuffsAtFrame, id).toBeUndefined()
    }
    const realmplay = skillIn(STORE, REALMPLAY_ID)
    expect(realmplay.tags).not.toContain("prop:isMartialSkillQ")
    expect(realmplay.receives).not.toContain("starweaveMartialBoost")
    expect(realmplay.triggersBuffs ?? []).not.toContain("jadeware")
  })
})

describe("healSkill", () => {
  it("adds starweaveMartialBoost to every Martial Art Skill's receives", () => {
    for (const id of STARWEAVE_SKILL_IDS) {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(healed.receives, id).toContain("starweaveMartialBoost")
    }
  })

  it("adds swallowcallLightAttackBoost to every Light Attack skill's receives", () => {
    for (const id of SWALLOWCALL_SKILL_IDS) {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(healed.receives, id).toContain("swallowcallLightAttackBoost")
    }
  })

  it("joins Realmplay to the Martial Art Skill roster it had been left out of", () => {
    const healed = healSkill(clone(skillIn(STORE, REALMPLAY_ID))) as Skill
    expect(healed.tags).toContain("prop:isMartialSkillQ")
    expect(healed.receives).toContain("starweaveMartialBoost")
    expect(healed.triggersBuffs).toContain("jadeware")
  })

  it("adds Iron Guards' 60 f delayed grant to Legion Summoner", () => {
    const healed = healSkill(clone(skillIn(STORE, "stonesplitStrength-phalanxspecial"))) as Skill
    expect(healed.triggersBuffsAtFrame).toEqual({ ironGuards: 60 })
  })

  it("adds Lingering Bone's at-the-hit delayed grant to Forsaken Fame and Peak's Springless Silence", () => {
    const forsakenFame = healSkill(clone(skillIn(STORE, "silkbindJade-fanlightcharged"))) as Skill
    expect(forsakenFame.triggersBuffsAtFrame).toEqual({ lingeringBone: 71 })
    const peaksSpringlessSilence = healSkill(
      clone(skillIn(STORE, "silkbindJade-fanspecial")),
    ) as Skill
    expect(peaksSpringlessSilence.triggersBuffsAtFrame).toEqual({ lingeringBone: 33 })
  })

  it("does not double-heal a copy that already carries the fields", () => {
    for (const id of ALL_HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id))) as Skill
      const twice = healSkill(clone(once))
      expect(twice, id).toEqual(once)
    }
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "stonesplitStrength-anxisoldiermosweep")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V49__perGrantSiteDelayAndSetReach — called directly", () => {
  it("heals every targeted id and leaves every other skill untouched", () => {
    const after = V49__perGrantSiteDelayAndSetReach.migrate(clone(STORE))
    expect(after.v).toBe(49)
    for (const id of STARWEAVE_SKILL_IDS)
      expect(skillIn(after, id).receives, id).toContain("starweaveMartialBoost")
    for (const id of SWALLOWCALL_SKILL_IDS)
      expect(skillIn(after, id).receives, id).toContain("swallowcallLightAttackBoost")
    for (const id of FRAME_IDS) expect(skillIn(after, id).triggersBuffsAtFrame, id).toBeTruthy()
    const realmplay = skillIn(after, REALMPLAY_ID)
    expect(realmplay.tags).toContain("prop:isMartialSkillQ")
    expect(realmplay.triggersBuffs).toContain("jadeware")

    for (const skill of STORE.skills) {
      if (ALL_HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V49__perGrantSiteDelayAndSetReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V49__perGrantSiteDelayAndSetReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V49__perGrantSiteDelayAndSetReach — through the chain", () => {
  it("is registered and is exactly what the v48 → v49 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V49__perGrantSiteDelayAndSetReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 49 })!
    expect(result.applied).toEqual(["V49__perGrantSiteDelayAndSetReach"])
    expect(result.blob.v).toBe(49)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V49__perGrantSiteDelayAndSetReach,
    )
    const result = runChain(withoutStep, 49, clone(STORE))!
    expect(result.applied).not.toContain("V49__perGrantSiteDelayAndSetReach")
    expect(skillIn(result.blob, STARWEAVE_SKILL_IDS[0]!).receives).not.toContain(
      "starweaveMartialBoost",
    )
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the additions after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const swordq = loaded.find((candidate) => candidate.id === "bellstrikeSplendor-swordq")!
    expect(swordq.receives).toContain("starweaveMartialBoost")
    const legionSummoner = loaded.find(
      (candidate) => candidate.id === "stonesplitStrength-phalanxspecial",
    )!
    expect(legionSummoner.triggersBuffsAtFrame).toEqual({ ironGuards: 60 })
    const realmplay = loaded.find((candidate) => candidate.id === REALMPLAY_ID)!
    expect(realmplay.tags).toContain("prop:isMartialSkillQ")
    expect(realmplay.triggersBuffs).toContain("jadeware")
  })
})
