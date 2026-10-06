import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V44__targetDistanceReachAndDisplacement,
  healSkill,
} from "../../src/migrations/customSkills/V44__targetDistanceReachAndDisplacement"
import { loadCustomSkills } from "../../src/storage"
import { seedSkillFromBuiltin, MYSTIC_ARTS_CLASS_ID, type Skill } from "../../src/engine/skill"
import { CLASS_IDS, classDefinition } from "../../src/definitions/classes/registry"
import { MYSTIC_SKILLS } from "../../src/data/skills/mystic"
import storeV43File from "./testCustomSkills/v43/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV43File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill | undefined =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)

// Every matchId V44 patches. Kept independent of
// `V44__targetDistanceReachAndDisplacement`'s own (unexported) patch table, so
// a change there that silently drops an id still leaves this list — and the
// completeness check below — unaffected.
const ALL_MATCH_IDS = [
  "bamboocutDraught-boundvessel",
  "bamboocutDraught-castlink",
  "bamboocutDraught-deflect-cancel",
  "bamboocutDraught-deflect-cancel-prepull",
  "bamboocutDraught-delay",
  "bamboocutDraught-dragonquench-inebriate",
  "bamboocutDraught-dragonquench-inebriate-cancel",
  "bamboocutDraught-dragonquench-inebriate-second",
  "bamboocutDraught-dragonquench-inebriate-second-cancel",
  "bamboocutDraught-dragonquench-inebriate-third",
  "bamboocutDraught-dragonquench-inebriate-third-cancel",
  "bamboocutDraught-ghostly-steps",
  "bamboocutDraught-golden-body-cancel",
  "bamboocutDraught-golden-body-deflect-cancel",
  "bamboocutDraught-heros-blood",
  "bamboocutDraught-heros-blood-inebriate",
  "bamboocutDraught-light-attack",
  "bamboocutDraught-nightwick-grounddrift",
  "bamboocutDraught-nightwick-primepick",
  "bamboocutDraught-nightwick-primepick-follow-up",
  "bamboocutDraught-nightwick-primepick-follow-up-cancel",
  "bamboocutDraught-peakfall",
  "bamboocutDraught-peakfall-prepull",
  "bamboocutDraught-perfect-dodge",
  "bamboocutDraught-perfect-dodge-full",
  "bamboocutDraught-quick-drink",
  "bamboocutDraught-quick-drink-cancel",
  "bamboocutDraught-realmplay",
  "bamboocutDraught-reveldrift",
  "bamboocutDraught-reveldrift-cancel",
  "bamboocutDraught-skystrike-gauntlets-ex",
  "bamboocutDraught-whaledraft",
  "bellstrikeSplendor-deflect-cancel",
  "bellstrikeSplendor-deflect-cancel-prepull",
  "bellstrikeSplendor-delay",
  "bellstrikeSplendor-energysurge",
  "bellstrikeSplendor-ghostly-steps",
  "bellstrikeSplendor-golden-body-cancel",
  "bellstrikeSplendor-golden-body-deflect-cancel",
  "bellstrikeSplendor-perfect-dodge",
  "bellstrikeSplendor-perfect-dodge-full",
  "bellstrikeSplendor-spearq",
  "bellstrikeSplendor-spearq-0-hit-cancel",
  "bellstrikeSplendor-spearq-prepull",
  "bellstrikeSplendor-swordheavycharged",
  "bellstrikeSplendor-swordheavycharged-2-hit",
  "bellstrikeSplendor-swordheavycharged-prepull",
  "bellstrikeSplendor-swordq",
  "bellstrikeSplendor-swordq-2nd",
  "bellstrikeSplendor-swordspecial",
  "bellstrikeSplendor-swordspecial-2nd",
  "bellstrikeSplendor-swordspecial-deflect",
  "bellstrikeUmbra-deflect-cancel",
  "bellstrikeUmbra-deflect-cancel-prepull",
  "bellstrikeUmbra-delay",
  "bellstrikeUmbra-ghostly-steps",
  "bellstrikeUmbra-golden-body-cancel",
  "bellstrikeUmbra-golden-body-deflect-cancel",
  "bellstrikeUmbra-perfect-dodge",
  "bellstrikeUmbra-perfect-dodge-full",
  "bellstrikeUmbra-spearheavy",
  "bellstrikeUmbra-spearheavy-1-hit",
  "bellstrikeUmbra-spearheavy-1-hit-prepull",
  "bellstrikeUmbra-spearheavy-stage-1",
  "bellstrikeUmbra-spearq",
  "bellstrikeUmbra-spearq-5-hit-cancel",
  "bellstrikeUmbra-spearspecial",
  "bellstrikeUmbra-spearspecial-1-hit-cancel",
  "bellstrikeUmbra-sword-charge-stage-1-1-hit",
  "bellstrikeUmbra-sword-charge-stage-1-2-hit",
  "bellstrikeUmbra-sword-charge-stage-1-3-hit",
  "bellstrikeUmbra-sword-charge-stage-1-4-hit",
  "bellstrikeUmbra-sword-charge-stage-1-5-hit",
  "bellstrikeUmbra-swordq",
  "bellstrikeUmbra-swordq-follow-up-1-hit-cancel",
  "bellstrikeUmbra-swordq-follow-up-2-hit-cancel",
  "bellstrikeUmbra-swordqfollowup",
  "mystic-dragon-fire-smolder-1-hit",
  "mystic-dragon-fire-smolder-2-hits",
  "mystic-dragon-head",
  "mystic-dragon-head-plus",
  "mystic-drunkenpoet-prepull",
  "mystic-fire-breath-1-hit",
  "mystic-fire-breath-1-hit-prepull",
  "mystic-fire-breath-2-hit",
  "mystic-flute-of-the-tides-cancel",
  "mystic-flute-of-the-tides-full",
  "mystic-flute-of-the-tides-prepull",
  "mystic-poet-final-hit-cancel",
  "mystic-poet1",
  "mystic-poet2",
  "mystic-poet3",
  "mystic-poet4",
  "mystic-soaring",
  "mystic-soaring-1-hit",
  "mystic-toad-cancel",
  "silkbindJade-deflect-cancel",
  "silkbindJade-deflect-cancel-prepull",
  "silkbindJade-delay",
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-fanheavypursuit-5-hit",
  "silkbindJade-fanlightcharged",
  "silkbindJade-fanq",
  "silkbindJade-fanq-prepull",
  "silkbindJade-fanqcancel",
  "silkbindJade-fanspecial",
  "silkbindJade-ghostly-steps",
  "silkbindJade-golden-body-cancel",
  "silkbindJade-golden-body-deflect-cancel",
  "silkbindJade-healer-buff",
  "silkbindJade-healer-extension",
  "silkbindJade-perfect-dodge",
  "silkbindJade-perfect-dodge-full",
  "silkbindJade-umb-heavylight",
  "silkbindJade-umbdronelaunch",
  "silkbindJade-umbdronelaunch-12hit",
  "silkbindJade-umbdronelaunch-16hit",
  "silkbindJade-umbdronelaunch-20hit",
  "silkbindJade-umbdronelaunch-23hit",
  "silkbindJade-umbdronelaunch-26hit",
  "silkbindJade-umblightcharge",
  "silkbindJade-umbq",
  "silkbindJade-umbq-prepull",
  "stonesplitStrength-blockperception",
  "stonesplitStrength-deflect",
  "stonesplitStrength-deflect-cancel",
  "stonesplitStrength-deflect-cancel-prepull",
  "stonesplitStrength-delay",
  "stonesplitStrength-ghostly-steps",
  "stonesplitStrength-golden-body-cancel",
  "stonesplitStrength-golden-body-deflect-cancel",
  "stonesplitStrength-perfect-dodge",
  "stonesplitStrength-perfect-dodge-full",
  "stonesplitStrength-phalanxcharged-s3",
  "stonesplitStrength-phalanxcharged-s3-innerpassion",
  "stonesplitStrength-phalanxspecial",
  "stonesplitStrength-phalanxspecial-prepull",
  "stonesplitStrength-snowpartingcharged",
  "stonesplitStrength-snowpartingcharged-forgetfulness",
  "stonesplitStrength-snowpartingdual",
  "stonesplitStrength-snowpartingdual-prepull",
  "stonesplitStrength-snowpartingq-stab",
  "stonesplitStrength-snowpartingslide",
  "stonesplitStrength-snowpartingslide-prepull",
  "stonesplitStrength-snowpartingslide-prepull-hit",
  "stonesplitStrength-snowpartingspecial",
  "stonesplitStrength-snowpartingvc",
  "stonesplitStrength-snowpartingvc-prepull",
]

function classIdOf(id: string): string {
  if (id.startsWith("mystic-")) return MYSTIC_ARTS_CLASS_ID
  for (const classId of CLASS_IDS()) if (id.startsWith(`${classId}-`)) return classId
  throw new Error(`no class owns id ${id}`)
}

function builtinFor(id: string): Skill {
  if (id.startsWith("mystic-")) {
    const found = MYSTIC_SKILLS.find((skill) => skill.id === id)
    if (!found) throw new Error(`missing mystic builtin ${id}`)
    return found
  }
  const classId = classIdOf(id)
  const found = classDefinition(classId)?.skills.find((skill) => skill.id === id)
  if (!found) throw new Error(`missing builtin ${id}`)
  return found
}

function withoutDistanceFields(skill: Skill): Skill {
  const { reachMeters, approach, displacement, ...rest } = skill
  return rest as Skill
}

// Ids the v43 fixture never captured a copy of (e.g. a universal action
// retargeted per class, still unedited) get their genuine pre-V44 shape from
// the current built-in, with this step's own three fields stripped back out.
function beforeShapeOf(id: string): Skill {
  const captured = skillIn(STORE, id)
  if (captured) return captured
  return seedSkillFromBuiltin(classIdOf(id), withoutDistanceFields(builtinFor(id)))
}

describe("the pre-V44 shape", () => {
  it("carries none of reachMeters, approach or displacement yet, for every matchId", () => {
    for (const id of ALL_MATCH_IDS) {
      const skill = beforeShapeOf(id)
      expect(skill.reachMeters, id).toBeUndefined()
      expect(skill.approach, id).toBeUndefined()
      expect(skill.displacement, id).toBeUndefined()
    }
  })
})

describe("healSkill", () => {
  it("adds exactly the reach, approach and displacement this step patches in, for every matchId", () => {
    for (const id of ALL_MATCH_IDS) {
      const before = beforeShapeOf(id)
      const healed = healSkill(clone(before)) as Skill
      const touchedSomething =
        healed.reachMeters !== undefined ||
        healed.approach !== undefined ||
        healed.displacement !== undefined
      expect(touchedSomething, id).toBe(true)
    }
  })

  it("does not double-heal a copy that already carries the fields", () => {
    const once = healSkill(clone(beforeShapeOf("bellstrikeUmbra-spearq"))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-crosswind-blade")!
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })

  it("never overwrites a value already present on the stored copy", () => {
    const edited: Skill = { ...beforeShapeOf("bellstrikeUmbra-spearq"), reachMeters: 99 }
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.reachMeters).toBe(99)
  })
})

interface Case {
  id: string
  reachMeters?: number
  approach?: "approach" | "stationary"
  displacement?: unknown
}

// A representative id per shape this step authors — reach alone, reach with
// a shrink-only pull, a teleport-banded displacement, a fixed-distance
// teleport, a stationary cast with a large sentinel reach, and a stationary
// mystic art — each hand-typed independently of the migration's own table.
const CASES: Case[] = [
  {
    id: "bellstrikeUmbra-swordq",
    reachMeters: 4,
  },
  {
    id: "bellstrikeUmbra-spearq",
    reachMeters: 3,
    displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  },
  {
    id: "bellstrikeUmbra-spearspecial",
    reachMeters: 3,
    displacement: {
      kind: "byDistance",
      bands: [{ minMeters: 1.5, maxMeters: 4.5, then: { kind: "toTarget", meters: 1.5 } }],
      otherwise: { kind: "towardTarget", referenceMeters: 0 },
    },
  },
  {
    id: "silkbindJade-fanspecial",
    reachMeters: 9,
    displacement: { kind: "toTarget", meters: 1.5 },
  },
  {
    id: "bellstrikeUmbra-deflect-cancel",
    reachMeters: 100,
    approach: "stationary",
  },
  {
    id: "mystic-flute-of-the-tides-full",
    reachMeters: 40,
    approach: "stationary",
  },
  {
    id: "bellstrikeSplendor-swordheavycharged",
    displacement: {
      kind: "byDistance",
      bands: [
        { minMeters: 0, maxMeters: 8.999, then: { kind: "toTarget", meters: 1 } },
        { minMeters: 9, maxMeters: 100, then: { kind: "selfForward", meters: 8 } },
      ],
      otherwise: { kind: "towardTarget", referenceMeters: 0 },
    },
  },
]

describe.each(CASES)("healSkill — $id", ({ id, reachMeters, approach, displacement }) => {
  it("adds exactly the reach, approach and displacement this id carries in game, asserted independently", () => {
    const healed = healSkill(clone(beforeShapeOf(id))) as Skill
    expect(healed.reachMeters, id).toBe(reachMeters)
    expect(healed.approach, id).toBe(approach)
    expect(healed.displacement, id).toEqual(displacement)
  })

  it("does not double-heal a copy that already carries the added shape", () => {
    const once = healSkill(clone(beforeShapeOf(id))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })
})

describe("V44__targetDistanceReachAndDisplacement — called directly", () => {
  it("heals every matchId the v43 fixture captured and leaves every other captured skill exactly as it was", () => {
    const after = V44__targetDistanceReachAndDisplacement.migrate(clone(STORE))
    expect(after.v).toBe(44)
    for (const skill of STORE.skills as Skill[]) {
      // A mystic art's suffix reaches a class-bound duplicate copy too (the
      // second copy of one mystic art, still under its pre-shared-id class
      // prefix) — genuinely healed, not left alone, so it is excluded here
      // by asking `healSkill` itself rather than by name.
      if (JSON.stringify(healSkill(clone(skill))) !== JSON.stringify(skill)) continue
      expect(skillIn(after, skill.id), skill.id).toEqual(skill)
    }
    for (const id of ALL_MATCH_IDS) {
      const captured = skillIn(STORE, id)
      if (!captured) continue
      const healed = skillIn(after, id)!
      const touchedSomething =
        healed.reachMeters !== undefined ||
        healed.approach !== undefined ||
        healed.displacement !== undefined
      expect(touchedSomething, id).toBe(true)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V44__targetDistanceReachAndDisplacement.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V44__targetDistanceReachAndDisplacement.migrate(clone(once))).toEqual(once)
  })
})

describe("V44__targetDistanceReachAndDisplacement — through the chain", () => {
  it("is registered and is exactly what the v43 → v44 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V44__targetDistanceReachAndDisplacement)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 44 })!
    expect(result.applied).toEqual(["V44__targetDistanceReachAndDisplacement"])
    expect(result.blob.v).toBe(44)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V44__targetDistanceReachAndDisplacement,
    )
    const result = runChain(withoutStep, 44, clone(STORE))!
    expect(result.applied).not.toContain("V44__targetDistanceReachAndDisplacement")
    expect(skillIn(result.blob, "bellstrikeUmbra-spearq")!.reachMeters).toBeUndefined()
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the fields after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === "bellstrikeUmbra-spearq")!
    expect(skill.reachMeters).toBe(3)
    expect(skill.displacement).toEqual({ kind: "towardTarget", referenceMeters: 1.75 })
  })
})
