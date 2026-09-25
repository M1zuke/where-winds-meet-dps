import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V24__umbraValueFixes,
  healSpearqRiverFlowTiers,
  healSpearq5HitCancelRiverFlowTiers,
  healSweepAllHits,
  healBleedDetonationHits,
  healCrosswindBladeTags,
  healHeavyAttackTag,
  healSpearheavyHits,
  healSpearheavyCastFrames,
  healSpearheavyStage2Tags,
  healSkill,
} from "../../src/migrations/customSkills/V24__umbraValueFixes"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import storeV23File from "./testCustomSkills/v23/store.json"

const STORE = storeV23File as unknown as RawCustomSkillsBlob
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string) =>
  (blob.skills as Record<string, unknown>[]).find((skill) => skill.id === id)!

const oldRiverFlowHit = () => ({
  id: "hit-4",
  frame: 82,
  physMultiplier: 0.321033,
  attributeMultiplier: 0.4815495,
  physFixed: 88.95,
  attributeFixed: 48.45,
  extraCritDamage: 0,
  triggers: [
    {
      kind: "applyBuff",
      targetId: "potentRiverFlow",
      stacks: 1,
      condition: null,
      appliesOnCastEnd: true,
    },
  ],
})

describe("custom-skills v23 fixture", () => {
  it("is v23 and still stores Sweep All's pre-ladder payload", () => {
    expect(STORE.v).toBe(V24__umbraValueFixes.to - 1)
    const sweepAll = skillIn(STORE, "bellstrikeUmbra-spearspecial")
    expect(sweepAll.tags).toContain("attack:heavy")
    expect((sweepAll.hits as unknown[]).length).toBe(1)
  })
})

describe("healSpearqRiverFlowTiers", () => {
  it("replaces the single unconditional River Flow trigger with the tier ladder", () => {
    const hits = [{}, {}, {}, {}, oldRiverFlowHit(), {}]
    const healed = healSpearqRiverFlowTiers(hits) as { triggers: Record<string, unknown>[] }[]
    const triggers = healed[4]!.triggers
    expect(triggers.map((trigger) => trigger.targetId)).toEqual([
      "buff-bellstrikeUmbra-wolfchasers-art-slotted",
      "buff-bellstrikeUmbra-water-drop",
      "buff-bellstrikeUmbra-water-drop",
      "buff-bellstrikeUmbra-spring-surge",
      "buff-bellstrikeUmbra-spring-surge",
      "potentRiverFlow",
      "buff-bellstrikeUmbra-empowered-river-flow",
    ])
    expect(triggers[5]!.condition).toEqual({
      buffId: "debuff-bellstrikeUmbra-bleed-tick",
      op: "gte",
      stacks: 1,
    })
    expect(triggers[6]!.condition).toEqual({
      buffId: "debuff-bellstrikeUmbra-bleed-tick",
      op: "gte",
      stacks: 1,
    })
  })

  it("leaves a hit list of the wrong length untouched", () => {
    const hits = [oldRiverFlowHit()]
    expect(healSpearqRiverFlowTiers(hits)).toBe(hits)
  })

  it("leaves an already-edited trigger untouched", () => {
    const edited = {
      ...oldRiverFlowHit(),
      triggers: [{ kind: "applyBuff", targetId: "somethingElse" }],
    }
    const hits = [{}, {}, {}, {}, edited, {}]
    const healed = healSpearqRiverFlowTiers(hits) as { triggers: unknown }[]
    expect(healed[4]!.triggers).toEqual(edited.triggers)
  })
})

describe("healSpearq5HitCancelRiverFlowTiers", () => {
  it("uses the 5-hit cancel's own, higher Empowered threshold", () => {
    const hits = [{}, {}, {}, {}, oldRiverFlowHit()]
    const healed = healSpearq5HitCancelRiverFlowTiers(hits) as {
      triggers: Record<string, unknown>[]
    }[]
    const triggers = healed[4]!.triggers
    expect(triggers[5]!.condition).toEqual({
      buffId: "debuff-bellstrikeUmbra-bleed-tick",
      op: "gte",
      stacks: 1,
    })
    expect(triggers[6]!.condition).toEqual({
      buffId: "debuff-bellstrikeUmbra-bleed-tick",
      op: "gte",
      stacks: 4,
    })
  })
})

describe("healSweepAllHits", () => {
  const pristineHit1 = () => ({
    id: "hit-0",
    frame: 16,
    physMultiplier: 0.6848704,
    attributeMultiplier: 1.0273056,
    physFixed: 189.76,
    attributeFixed: 103.36,
    extraCritDamage: 0,
    triggers: [],
  })
  const pristineHit2 = () => ({
    id: "hit-1",
    frame: 58,
    physMultiplier: 1.0273056,
    attributeMultiplier: 1.5409584,
    physFixed: 284.64,
    attributeFixed: 155.04,
    extraCritDamage: 0,
    triggers: [],
  })

  it("inserts the Shattered Stone hit ahead of both pristine damage hits", () => {
    const healed = healSweepAllHits([pristineHit1(), pristineHit2()]) as Record<string, unknown>[]
    expect(healed).toHaveLength(3)
    expect(healed[0]!.frame).toBe(0)
    expect(healed[0]!.physMultiplier).toBe(0)
    expect(healed[1]!.frame).toBe(16)
    expect(healed[2]!.frame).toBe(58)
  })

  it("inserts it ahead of the pristine 1-hit cancel form's single hit", () => {
    const healed = healSweepAllHits([pristineHit1()]) as Record<string, unknown>[]
    expect(healed).toHaveLength(2)
    expect(healed[0]!.frame).toBe(0)
    expect(healed[1]!.frame).toBe(16)
  })

  it("leaves an edited hit row untouched", () => {
    const sweepAll = skillIn(STORE, "bellstrikeUmbra-spearspecial")
    const healed = healSweepAllHits(clone(sweepAll.hits))
    expect(healed).toEqual(sweepAll.hits)
  })
})

describe("healBleedDetonationHits", () => {
  it("appends the Bleeding extension alongside the Smolder one", () => {
    const hits = [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 2.4,
        attributeMultiplier: 3.6,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "applyDebuff",
            targetId: "debuff-mystic-smolder",
            stacks: 0,
            condition: { buffId: "buff-bellstrikeUmbra-zenith-detonation", op: "gte", stacks: 1 },
            extendFrames: 600,
            extendOnly: true,
            maxExtendedDurationFrames: 960,
          },
        ],
      },
    ]
    const healed = healBleedDetonationHits(hits) as { triggers: Record<string, unknown>[] }[]
    expect(healed[0]!.triggers).toHaveLength(2)
    expect(healed[0]!.triggers[1]!.targetId).toBe("debuff-bellstrikeUmbra-bleed-tick")
  })

  it("does not duplicate the extension on a second run", () => {
    const hits = [
      {
        triggers: [
          { kind: "applyDebuff", targetId: "debuff-mystic-smolder" },
          { kind: "applyDebuff", targetId: "debuff-bellstrikeUmbra-bleed-tick" },
        ],
      },
    ]
    expect(healBleedDetonationHits(hits)).toBe(hits)
  })
})

describe("healCrosswindBladeTags", () => {
  it("adds the Special attunement to Crisscross - Inner Balance III and its cancel form", () => {
    expect(healCrosswindBladeTags("bellstrikeUmbra-crosswind-blade", ["weapon:Sword"])).toEqual([
      "weapon:Sword",
      "attune:swordSpecial",
    ])
    expect(
      healCrosswindBladeTags("bellstrikeUmbra-crosswind-blade-cancel", ["weapon:Sword"]),
    ).toEqual(["weapon:Sword", "attune:swordSpecial"])
  })

  it("does not touch an unrelated skill's tags", () => {
    const tags = ["weapon:Sword"]
    expect(healCrosswindBladeTags("bellstrikeUmbra-swordq", tags)).toBe(tags)
  })
})

describe("healHeavyAttackTag", () => {
  it("drops the heavy-attack tag from Drifting Thrust's level-0/prepull forms and Sweep All", () => {
    const tags = ["weapon:Spear", "attack:heavy", "attune:spearCharged"]
    expect(healHeavyAttackTag("bellstrikeUmbra-spearheavy-1-hit", tags)).toEqual([
      "weapon:Spear",
      "attune:spearCharged",
    ])
    expect(healHeavyAttackTag("bellstrikeUmbra-swordq", tags)).toBe(tags)
  })

  it("leaves spearheavy alone — its heavy-attack tag is tied to the stage-2 hits reshape instead", () => {
    const tags = ["weapon:Spear", "attack:heavy", "attune:spearCharged"]
    expect(healHeavyAttackTag("bellstrikeUmbra-spearheavy", tags)).toBe(tags)
  })
})

describe("healSpearheavyStage2Tags", () => {
  it("drops both the heavy-attack tag and the Charged attunement", () => {
    const skill = {
      id: "bellstrikeUmbra-spearheavy",
      tags: ["weapon:Spear", "attack:heavy", "attune:spearCharged"],
    }
    expect(healSpearheavyStage2Tags(skill)).toEqual({
      id: "bellstrikeUmbra-spearheavy",
      tags: ["weapon:Spear"],
    })
  })

  it("does not touch another skill", () => {
    const skill = { id: "bellstrikeUmbra-spearheavy-1-hit", tags: ["weapon:Spear", "attack:heavy"] }
    expect(healSpearheavyStage2Tags(skill)).toBe(skill)
  })
})

describe("healSpearheavyHits", () => {
  const oldHits = () => [
    { physMultiplier: 1.250878, attributeMultiplier: 1.876317, physFixed: 346 },
    { physMultiplier: 0.750527, attributeMultiplier: 1.12579, physFixed: 207.6 },
    { physMultiplier: 0.375263, attributeMultiplier: 0.562895, physFixed: 103.8 },
    { physMultiplier: 1.250878, attributeMultiplier: 1.876317, physFixed: 346 },
    { physMultiplier: 0.331483, attributeMultiplier: 0.497224, physFixed: 91.69 },
  ]

  it("replaces the pristine 5-hit blend with the real 16-hit stage-2 shape", () => {
    const healed = healSpearheavyHits("bellstrikeUmbra-spearheavy", oldHits()) as unknown[]
    expect(healed).toHaveLength(16)
  })

  it("leaves an edited row untouched", () => {
    const edited = oldHits()
    edited[0]!.physMultiplier = 9
    expect(healSpearheavyHits("bellstrikeUmbra-spearheavy", edited)).toBe(edited)
  })

  it("does not touch another skill's hits", () => {
    const hits = oldHits()
    expect(healSpearheavyHits("bellstrikeUmbra-spearheavy-1-hit", hits)).toBe(hits)
  })
})

describe("healSpearheavyCastFrames", () => {
  it("raises a still-pristine castFrames to cover the reshaped hits", () => {
    const skill = { id: "bellstrikeUmbra-spearheavy", castFrames: 90 }
    expect(healSpearheavyCastFrames(skill)).toEqual({
      id: "bellstrikeUmbra-spearheavy",
      castFrames: 156,
    })
  })

  it("leaves an edited castFrames alone", () => {
    const skill = { id: "bellstrikeUmbra-spearheavy", castFrames: 200 }
    expect(healSpearheavyCastFrames(skill)).toBe(skill)
  })

  it("does not touch another skill", () => {
    const skill = { id: "bellstrikeUmbra-spearheavy-1-hit", castFrames: 90 }
    expect(healSpearheavyCastFrames(skill)).toBe(skill)
  })
})

describe("healSkill", () => {
  it("heals every affected field on one record in a single pass", () => {
    const skill = {
      id: "bellstrikeUmbra-spearheavy",
      tags: ["weapon:Spear", "attack:heavy", "attune:spearCharged"],
      castFrames: 90,
      hits: [
        { physMultiplier: 1.250878, attributeMultiplier: 1.876317, physFixed: 346 },
        { physMultiplier: 0.750527, attributeMultiplier: 1.12579, physFixed: 207.6 },
        { physMultiplier: 0.375263, attributeMultiplier: 0.562895, physFixed: 103.8 },
        { physMultiplier: 1.250878, attributeMultiplier: 1.876317, physFixed: 346 },
        { physMultiplier: 0.331483, attributeMultiplier: 0.497224, physFixed: 91.69 },
      ],
    }
    const healed = healSkill(skill) as { tags: string[]; hits: unknown[]; castFrames: number }
    expect(healed.tags).toEqual(["weapon:Spear"])
    expect(healed.hits).toHaveLength(16)
    expect(healed.castFrames).toBe(156)
  })

  it("passes a skill with no matching id through unchanged", () => {
    const skill = { id: "someOtherClass-someSkill", tags: ["weapon:Sword"] }
    expect(healSkill(skill)).toEqual(skill)
  })
})

describe("V24__umbraValueFixes migration step", () => {
  it("is registered in the chain and lands the fixture at v24", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V24__umbraValueFixes)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 24 })!
    expect(result.blob.v).toBe(24)
    expect(result.applied).toEqual([V24__umbraValueFixes.name])
  })

  it("heals Sweep All's tags but keeps its edited hits, on the real fixture", () => {
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 24 })!
    const sweepAll = skillIn(result.blob, "bellstrikeUmbra-spearspecial")
    expect(sweepAll.tags).not.toContain("attack:heavy")
    expect(sweepAll.hits).toEqual(skillIn(STORE, "bellstrikeUmbra-spearspecial").hits)
  })

  const TOUCHED_IDS = new Set([
    "bellstrikeUmbra-spearq",
    "bellstrikeUmbra-spearq-5-hit-cancel",
    "bellstrikeUmbra-spearspecial",
    "bellstrikeUmbra-spearspecial-1-hit-cancel",
    "bellstrikeUmbra-bleed-detonation",
    "bellstrikeUmbra-crosswind-blade",
    "bellstrikeUmbra-crosswind-blade-cancel",
    "bellstrikeUmbra-spearheavy",
    "bellstrikeUmbra-spearheavy-1-hit",
    "bellstrikeUmbra-spearheavy-1-hit-prepull",
  ])

  it("leaves every skill it does not target exactly as the build had it", () => {
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 24 })!
    for (const skill of STORE.skills as Record<string, unknown>[]) {
      if (TOUCHED_IDS.has(skill.id as string)) continue
      expect(skillIn(result.blob, skill.id as string), skill.id as string).toEqual(skill)
    }
  })

  it("rewrites each pristine copy it targets to the ladder/payload/attunement/reshape it claims, on the real captured fixture", () => {
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 24 })!

    const spearq = skillIn(result.blob, "bellstrikeUmbra-spearq")
    expect((spearq.hits as { triggers: unknown[] }[])[4]!.triggers).toHaveLength(7)

    const spearq5HitCancel = skillIn(result.blob, "bellstrikeUmbra-spearq-5-hit-cancel")
    expect((spearq5HitCancel.hits as { triggers: unknown[] }[])[4]!.triggers).toHaveLength(7)

    const spearspecial1HitCancel = skillIn(result.blob, "bellstrikeUmbra-spearspecial-1-hit-cancel")
    expect(spearspecial1HitCancel.hits).toHaveLength(2)
    expect(spearspecial1HitCancel.tags).not.toContain("attack:heavy")

    const bleedDetonation = skillIn(result.blob, "bellstrikeUmbra-bleed-detonation")
    expect((bleedDetonation.hits as { triggers: unknown[] }[])[0]!.triggers).toHaveLength(2)

    const crosswindBlade = skillIn(result.blob, "bellstrikeUmbra-crosswind-blade")
    expect(crosswindBlade.tags).toContain("attune:swordSpecial")
    const crosswindBladeCancel = skillIn(result.blob, "bellstrikeUmbra-crosswind-blade-cancel")
    expect(crosswindBladeCancel.tags).toContain("attune:swordSpecial")

    const spearheavy = skillIn(result.blob, "bellstrikeUmbra-spearheavy")
    expect(spearheavy.hits).toHaveLength(16)
    expect(spearheavy.castFrames).toBe(156)
    expect(spearheavy.tags).toEqual(["weapon:Spear"])
  })

  it("lands every pristine copy it targets on exactly the live built-in's hits, tags and castFrames", () => {
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 24 })!
    const builtins = builtinSkillsForClass("bellstrikeUmbra")
    for (const id of [
      "bellstrikeUmbra-spearq",
      "bellstrikeUmbra-spearq-5-hit-cancel",
      "bellstrikeUmbra-bleed-detonation",
      "bellstrikeUmbra-crosswind-blade",
      "bellstrikeUmbra-crosswind-blade-cancel",
      "bellstrikeUmbra-spearheavy",
      "bellstrikeUmbra-spearspecial-1-hit-cancel",
    ]) {
      const healed = skillIn(result.blob, id)
      const builtin = builtins.find((skill) => skill.id === id)!
      expect(healed.hits, id).toEqual(builtin.hits)
      expect(healed.tags, id).toEqual(builtin.tags)
      expect(healed.castFrames, id).toEqual(builtin.castFrames)
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V24__umbraValueFixes.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is idempotent: running it twice matches running it once", () => {
    const once = V24__umbraValueFixes.migrate(clone(STORE))
    const twice = V24__umbraValueFixes.migrate(clone(once))
    expect(twice).toEqual(once)
  })
})
