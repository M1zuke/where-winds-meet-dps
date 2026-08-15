import { beforeEach, describe, expect, it } from "vitest"
import {
  isSkill,
  isHitTrigger,
  isHitVariant,
  makeSkill,
  makeHit,
  makeTrigger,
  hitToArtRow,
  seedSkillFromBuiltin,
  triggerConditions,
  newVariantId,
  type HitVariant,
} from "../../src/engine/skill"
import {
  saveCustomSkill,
  loadCustomSkillsForClass,
  exportCustomSkill,
  importCustomSkill,
} from "../../src/storage"
import { kvStore } from "../../src/kvStore"

const CLASS = "bellstrikeUmbra"

describe("makeSkill / makeHit — defaults", () => {
  it("makeSkill seeds one hit and sane defaults", () => {
    const s = makeSkill(CLASS, { name: "test" })
    expect(s.classId).toBe(CLASS)
    expect(s.name).toBe("test")
    expect(s.skillType).toBe("weapon")
    expect(s.hits).toHaveLength(1)
    expect(s.castFrames).toBe(0)
    expect(s.triggerable).toBe(true)
    expect(isSkill(s)).toBe(true)
  })

  it("makeHit defaults every numeric field to 0 and has no triggers", () => {
    const h = makeHit()
    expect(h.frame).toBe(0)
    expect(h.physMultiplier).toBe(0)
    expect(h.attributeMultiplier).toBe(0)
    expect(h.physFixed).toBe(0)
    expect(h.attributeFixed).toBe(0)
    expect(h.extraCritDamage).toBe(0)
    expect(h.triggers).toEqual([])
  })

  it("makeTrigger defaults to an ungated applyBuff with stacks 1", () => {
    const tr = makeTrigger()
    expect(tr.kind).toBe("applyBuff")
    expect(tr.stacks).toBe(1)
    expect(tr.condition).toBeNull()
  })
})

describe("isSkill — validation", () => {
  it("rejects a skill missing hits / with a malformed hit", () => {
    const s = makeSkill(CLASS, { name: "x" })
    expect(isSkill({ ...s, hits: "not-an-array" })).toBe(false)
    expect(isSkill({ ...s, hits: [{ ...s.hits[0], frame: "0" }] })).toBe(false)
  })

  it("rejects a hit with a malformed trigger", () => {
    const s = makeSkill(CLASS, {
      name: "x",
      hits: [makeHit({ triggers: [{ ...makeTrigger(), kind: "not-a-kind" as never }] })],
    })
    expect(isSkill(s)).toBe(false)
  })

  it("accepts a well-formed skill with a gated trigger", () => {
    const s = makeSkill(CLASS, {
      name: "Sword Special",
      hits: [
        makeHit({
          triggers: [
            makeTrigger({
              kind: "castSkill",
              targetId: "sk-1",
              condition: { buffId: "bf-1", op: "gte", stacks: 5 },
            }),
          ],
        }),
      ],
    })
    expect(isSkill(s)).toBe(true)
  })

  it("tolerates a skill object missing triggerable (pre-flag blob)", () => {
    const s = makeSkill(CLASS, { name: "legacy" })
    const { triggerable: _drop, ...legacy } = s
    void _drop
    expect(isSkill(legacy)).toBe(true)
  })
})

describe("isHitTrigger — the two logic-free DoT link kinds", () => {
  it("accepts a well-formed applyDot trigger", () => {
    const tr = makeTrigger({ kind: "applyDot", targetId: "df-bleed", stacks: 1, condition: null })
    expect(isHitTrigger(tr)).toBe(true)
  })

  it("accepts a well-formed detonateDot trigger", () => {
    const tr = makeTrigger({
      kind: "detonateDot",
      targetId: "df-bleed",
      stacks: 0,
      condition: null,
    })
    expect(isHitTrigger(tr)).toBe(true)
  })

  it("still rejects an unrecognized kind", () => {
    const tr = { ...makeTrigger(), kind: "not-a-kind" as never }
    expect(isHitTrigger(tr)).toBe(false)
  })
})

function makeVariant(patch: Partial<HitVariant> = {}): HitVariant {
  return {
    id: newVariantId(),
    label: "Empowered",
    conditions: [{ buffId: "bf-1", op: "gte", stacks: 1 }],
    physMultiplier: 1,
    attributeMultiplier: 1,
    physFixed: 0,
    attributeFixed: 0,
    ...patch,
  }
}

describe("isHitVariant / isSkill — hit-variant validation", () => {
  it("accepts a well-formed variant", () => {
    expect(isHitVariant(makeVariant())).toBe(true)
  })

  it("rejects a variant with a malformed condition or a non-finite coefficient", () => {
    expect(
      isHitVariant({ ...makeVariant(), conditions: [{ buffId: "bf-1", op: "bogus", stacks: 1 }] }),
    ).toBe(false)
    expect(isHitVariant({ ...makeVariant(), physMultiplier: "1" as never })).toBe(false)
  })

  it("isSkill rejects a hit whose variants is not an array, and one containing a malformed variant", () => {
    const s = makeSkill(CLASS, { name: "x" })
    expect(isSkill({ ...s, hits: [{ ...s.hits[0], variants: "nope" }] })).toBe(false)
    expect(
      isSkill({
        ...s,
        hits: [{ ...s.hits[0], variants: [{ ...makeVariant(), label: 5 as never }] }],
      }),
    ).toBe(false)
  })

  it("isSkill accepts a hit with a well-formed variants list", () => {
    const s = makeSkill(CLASS, {
      name: "x",
      hits: [makeHit({ variants: [makeVariant()] })],
    })
    expect(isSkill(s)).toBe(true)
  })
})

describe("isHitTrigger — multi-condition `conditions`", () => {
  it("accepts a trigger with a valid conditions array", () => {
    const tr = makeTrigger({ conditions: [{ buffId: "bf-1", op: "eq", stacks: 0 }] })
    expect(isHitTrigger(tr)).toBe(true)
  })

  it("accepts a trigger with no conditions field at all", () => {
    const tr = makeTrigger()
    expect(tr.conditions).toBeUndefined()
    expect(isHitTrigger(tr)).toBe(true)
  })

  it("rejects a malformed conditions entry", () => {
    const tr = { ...makeTrigger(), conditions: [{ buffId: "bf-1", op: "nope", stacks: 0 }] }
    expect(isHitTrigger(tr as never)).toBe(false)
  })
})

describe("triggerConditions — merging legacy condition + extra conditions", () => {
  it("returns [] for an ungated trigger", () => {
    const tr = makeTrigger({ condition: null })
    expect(triggerConditions(tr)).toEqual([])
  })

  it("returns just the legacy condition when conditions is absent", () => {
    const tr = makeTrigger({ condition: { buffId: "bf-1", op: "gte", stacks: 1 } })
    expect(triggerConditions(tr)).toEqual([{ buffId: "bf-1", op: "gte", stacks: 1 }])
  })

  it("merges the legacy condition with extra conditions, legacy first", () => {
    const tr = makeTrigger({
      condition: { buffId: "bf-1", op: "gte", stacks: 1 },
      conditions: [{ buffId: "bf-2", op: "eq", stacks: 0 }],
    })
    expect(triggerConditions(tr)).toEqual([
      { buffId: "bf-1", op: "gte", stacks: 1 },
      { buffId: "bf-2", op: "eq", stacks: 0 },
    ])
  })
})

describe("hitToArtRow — mapping into the formula's ArtRow", () => {
  it("carries the hit's coefficients/flats and the skill's type/weapon/attribute", () => {
    const skill = makeSkill(CLASS, {
      name: "Sword QQ",
      skillType: "weapon",
      weaponOrAttribute: "Sword",
      attributeAttack: "Bellstrike",
    })
    const hit = makeHit({
      physMultiplier: 2.72,
      physFixed: 10,
      attributeMultiplier: 0.5,
      attributeFixed: 3,
      extraCritDamage: 0.1,
    })
    const art = hitToArtRow(hit, skill) as unknown as Record<string, unknown>
    expect(art.name).toBe("Sword QQ")
    expect(art.physMultiplier).toBe(2.72)
    expect(art.physFixed).toBe(10)
    expect(art.attributeMultiplier).toBe(0.5)
    expect(art.attributeFixed).toBe(3)
    expect(art.extraCritDamage).toBe(0.1)
    expect(art.skillType).toBe("weapon")
    expect(art.weaponOrAttribute).toBe("Sword")
    expect(art.attributeAttack).toBe("Bellstrike")
  })

  it("defaults skillType to weapon and drops empty weapon/attribute to undefined", () => {
    const skill = makeSkill(CLASS, {
      name: "bare",
      skillType: "",
      weaponOrAttribute: "",
      attributeAttack: "",
    })
    const art = hitToArtRow(makeHit(), skill) as unknown as Record<string, unknown>
    expect(art.skillType).toBe("weapon")
    expect(art.weaponOrAttribute).toBeUndefined()
    expect(art.attributeAttack).toBeUndefined()
  })
})

describe("seedSkillFromBuiltin — editable copy of a built-in skill", () => {
  it("keeps the source id but gives hits fresh ids, detached from the source", () => {
    const src = makeSkill(CLASS, {
      name: "Test",
      skillType: "weapon",
      weaponOrAttribute: "Sword",
      attributeAttack: "Bamboocut",
      tags: ["prop:isCharged"],
      hits: [
        makeHit({
          physMultiplier: 1.5,
          physFixed: 20,
          attributeMultiplier: 0.2,
          attributeFixed: 5,
          extraCritDamage: 0.05,
          triggers: [makeTrigger({ kind: "applyBuff", targetId: "bf-1" })],
        }),
      ],
    })
    const s = seedSkillFromBuiltin(CLASS, src)
    expect(s.id).toBe(src.id)
    expect(s.name).toBe("Test")
    expect(s.skillType).toBe("weapon")
    expect(s.weaponOrAttribute).toBe("Sword")
    expect(s.attributeAttack).toBe("Bamboocut")
    expect(s.tags).toEqual(["prop:isCharged"])
    expect(s.hits).toHaveLength(1)
    expect(s.hits[0].id).not.toBe(src.hits[0].id)
    expect(s.hits[0].physMultiplier).toBe(1.5)
    expect(s.hits[0].physFixed).toBe(20)
    expect(s.hits[0].triggers[0].targetId).toBe("bf-1")
    expect(s.hits[0].triggers[0]).not.toBe(src.hits[0].triggers[0])
    s.tags!.push("extra")
    s.hits[0].physMultiplier = 999
    expect(src.tags).toEqual(["prop:isCharged"])
    expect(src.hits[0].physMultiplier).toBe(1.5)
  })

  it("deep-copies a hit's variants: fresh variant ids, detached conditions", () => {
    const variant = makeVariant({ label: "River Flow", physMultiplier: 2 })
    const src = makeSkill(CLASS, {
      name: "Test",
      hits: [makeHit({ variants: [variant] })],
    })
    const s = seedSkillFromBuiltin(CLASS, src)
    expect(s.hits[0].variants).toHaveLength(1)
    const copied = s.hits[0].variants![0]
    expect(copied.id).not.toBe(variant.id)
    expect(copied.label).toBe("River Flow")
    expect(copied.physMultiplier).toBe(2)
    expect(copied.conditions).toEqual(variant.conditions)

    copied.physMultiplier = 999
    copied.conditions.push({ buffId: "bf-extra", op: "eq", stacks: 0 })
    expect(src.hits[0].variants![0].physMultiplier).toBe(2)
    expect(src.hits[0].variants![0].conditions).toHaveLength(1)
  })
})

describe("storage round-trip", () => {
  beforeEach(() => {
    try {
      kvStore.remove("wwm.customSkills")
    } catch {}
  })

  it("save → load preserves hits + triggers", () => {
    const s = makeSkill(CLASS, {
      name: "Saved Skill",
      hits: [
        makeHit({
          physMultiplier: 1.5,
          physFixed: 42,
          triggers: [makeTrigger({ kind: "applyBuff", targetId: "bf-1", stacks: 1 })],
        }),
      ],
    })
    saveCustomSkill(s)
    const loaded = loadCustomSkillsForClass(CLASS)
    const found = loaded.find((x) => x.id === s.id)
    expect(found).toBeTruthy()
    expect(found!.hits[0].physMultiplier).toBe(1.5)
    expect(found!.hits[0].triggers[0].targetId).toBe("bf-1")
  })

  it("export → import regenerates skill/hit ids and forces classId", () => {
    const s = makeSkill(CLASS, {
      name: "ExportSkill",
      hits: [
        makeHit({ physFixed: 7, triggers: [makeTrigger({ kind: "castSkill", targetId: "sk-x" })] }),
      ],
    })
    const imported = importCustomSkill(exportCustomSkill(s), "bellstrikeUmbra")
    expect(imported.id).not.toBe(s.id)
    expect(imported.classId).toBe("bellstrikeUmbra")
    expect(imported.hits[0].id).not.toBe(s.hits[0].id)
    expect(imported.hits[0].physFixed).toBe(7)
    expect(imported.hits[0].triggers[0].targetId).toBe("sk-x")
  })

  it("export → import carries an explicit receives/triggersBuffs through unchanged", () => {
    const skill = makeSkill(CLASS, {
      name: "ExportReachSkill",
      receives: ["bellstrikeUmbraBleedPen"],
      triggersBuffs: ["jadeware"],
    })
    const imported = importCustomSkill(exportCustomSkill(skill), "bellstrikeUmbra")
    expect(imported.receives).toEqual(["bellstrikeUmbraBleedPen"])
    expect(imported.triggersBuffs).toEqual(["jadeware"])
  })

  it("import heals triggersBuffs immediately for a name-derived cast tag, same as saveCustomSkill", () => {
    const spearQNamed = makeSkill(CLASS, { name: "Spear Q" })
    const imported = importCustomSkill(exportCustomSkill(spearQNamed), "bellstrikeUmbra")
    expect(imported.triggersBuffs).toEqual(
      expect.arrayContaining(["potentRiverFlow", "wineGu", "soulShaken", "jadeware"]),
    )
  })

  it("export → import carries variants and multi-condition triggers through, with fresh variant ids", () => {
    const s = makeSkill(CLASS, {
      name: "GatedExportSkill",
      hits: [
        makeHit({
          physMultiplier: 1,
          physFixed: 10,
          variants: [
            {
              id: "hv-1",
              label: "Empowered",
              conditions: [{ buffId: "bf-gate", op: "gte", stacks: 1 }],
              physMultiplier: 5,
              attributeMultiplier: 0,
              physFixed: 500,
              attributeFixed: 0,
            },
          ],
          triggers: [
            makeTrigger({
              kind: "applyBuff",
              targetId: "bf-cooldown",
              stacks: 1,
              condition: { buffId: "bf-gate", op: "gte", stacks: 1 },
              conditions: [{ buffId: "bf-cooldown", op: "eq", stacks: 0 }],
            }),
          ],
        }),
      ],
    })
    const imported = importCustomSkill(exportCustomSkill(s), "bellstrikeUmbra")
    expect(imported.hits[0].variants).toHaveLength(1)
    expect(imported.hits[0].variants![0].id).not.toBe(s.hits[0].variants![0].id)
    expect(imported.hits[0].variants![0].physMultiplier).toBe(5)
    expect(imported.hits[0].variants![0].conditions).toEqual([
      { buffId: "bf-gate", op: "gte", stacks: 1 },
    ])
    expect(imported.hits[0].triggers[0].conditions).toEqual([
      { buffId: "bf-cooldown", op: "eq", stacks: 0 },
    ])
  })

  it("a stale v1 (customSkill) blob is dropped on load", () => {
    kvStore.set(
      "wwm.customSkills",
      JSON.stringify({
        v: 1,
        skills: [
          {
            id: "cs-1",
            classId: CLASS,
            name: "old",
            kind: "new",
            physMultiplier: 1,
            physFixed: 0,
            attributeMultiplier: 0,
            attributeFixed: 0,
            createdAt: "2020-01-01T00:00:00.000Z",
            updatedAt: "2020-01-01T00:00:00.000Z",
          },
        ],
      }),
    )
    expect(loadCustomSkillsForClass(CLASS)).toEqual([])
  })

  it("save/load preserves an explicit triggerable: false", () => {
    const s = makeSkill(CLASS, { name: "Non-Trigger Skill", triggerable: false })
    saveCustomSkill(s)
    const found = loadCustomSkillsForClass(CLASS).find((x) => x.id === s.id)
    expect(found?.triggerable).toBe(false)
  })

  it("a current-version blob whose skill omits triggerable hydrates to true on load", () => {
    const legacy = makeSkill(CLASS, { name: "Old Skill" }) as unknown as Record<string, unknown>
    delete legacy.triggerable
    kvStore.set("wwm.customSkills", JSON.stringify({ v: 3, skills: [legacy] }))
    const found = loadCustomSkillsForClass(CLASS).find((x) => x.name === "Old Skill")
    expect(found?.triggerable).toBe(true)
  })

  it("importCustomSkill defaults triggerable to true when absent and preserves false when present", () => {
    const withoutFlag = makeSkill(CLASS, { name: "a" }) as unknown as Record<string, unknown>
    delete withoutFlag.triggerable
    const importedDefault = importCustomSkill(JSON.stringify(withoutFlag), CLASS)
    expect(importedDefault.triggerable).toBe(true)

    const s = makeSkill(CLASS, { name: "b", triggerable: false })
    const imported = importCustomSkill(exportCustomSkill(s), CLASS)
    expect(imported.triggerable).toBe(false)
  })
})

describe("storage round-trip — hit variants + multi-condition triggers", () => {
  beforeEach(() => {
    try {
      kvStore.remove("wwm.customSkills")
    } catch {}
  })

  it("a skill with variants + multi-condition triggers survives save → load intact", () => {
    const s = makeSkill(CLASS, {
      name: "Gated Skill",
      hits: [
        makeHit({
          physMultiplier: 1,
          physFixed: 10,
          variants: [
            {
              id: "hv-1",
              label: "Empowered",
              conditions: [{ buffId: "bf-gate", op: "gte", stacks: 1 }],
              physMultiplier: 5,
              attributeMultiplier: 0,
              physFixed: 500,
              attributeFixed: 0,
            },
          ],
          triggers: [
            makeTrigger({
              kind: "applyBuff",
              targetId: "bf-cooldown",
              stacks: 1,
              condition: { buffId: "bf-gate", op: "gte", stacks: 1 },
              conditions: [{ buffId: "bf-cooldown", op: "eq", stacks: 0 }],
            }),
          ],
        }),
      ],
    })
    saveCustomSkill(s)
    const found = loadCustomSkillsForClass(CLASS).find((x) => x.id === s.id)
    expect(found).toBeTruthy()
    expect(found!.hits[0].variants).toEqual(s.hits[0].variants)
    expect(found!.hits[0].triggers[0].conditions).toEqual([
      { buffId: "bf-cooldown", op: "eq", stacks: 0 },
    ])
  })

  it("a malformed variant is dropped on load, the rest of the skill intact", () => {
    const s = makeSkill(CLASS, {
      name: "Bad Variant Skill",
      hits: [
        makeHit({
          physMultiplier: 1,
          physFixed: 10,
          variants: [
            {
              id: "hv-ok",
              label: "Ok",
              conditions: [{ buffId: "bf-1", op: "gte", stacks: 1 }],
              physMultiplier: 2,
              attributeMultiplier: 0,
              physFixed: 0,
              attributeFixed: 0,
            },
            {
              id: "hv-bad",
              label: "Bad",
              conditions: [{ buffId: "bf-1", op: "nope" as never, stacks: 1 }],
              physMultiplier: 3,
              attributeMultiplier: 0,
              physFixed: 0,
              attributeFixed: 0,
            },
          ],
        }),
      ],
    })
    kvStore.set("wwm.customSkills", JSON.stringify({ v: 3, skills: [s] }))
    const found = loadCustomSkillsForClass(CLASS).find((x) => x.id === s.id)
    expect(found).toBeTruthy()
    expect(found!.hits[0].variants).toHaveLength(1)
    expect(found!.hits[0].variants![0].id).toBe("hv-ok")
    expect(found!.hits[0].physFixed).toBe(10)
  })

  it("hydration is idempotent — loading twice yields deep-equal results", () => {
    const s = makeSkill(CLASS, {
      name: "Idempotent Skill",
      hits: [
        makeHit({
          variants: [
            {
              id: "hv-1",
              label: "E",
              conditions: [{ buffId: "bf-1", op: "gte", stacks: 1 }],
              physMultiplier: 1,
              attributeMultiplier: 0,
              physFixed: 0,
              attributeFixed: 0,
            },
          ],
          triggers: [makeTrigger({ conditions: [{ buffId: "bf-2", op: "eq", stacks: 0 }] })],
        }),
      ],
    })
    saveCustomSkill(s)
    const first = loadCustomSkillsForClass(CLASS).find((x) => x.id === s.id)
    const second = loadCustomSkillsForClass(CLASS).find((x) => x.id === s.id)
    expect(first).toEqual(second)
  })

  it("a pre-feature stored skill (no variants/conditions fields at all) loads unchanged", () => {
    const legacy = makeSkill(CLASS, {
      name: "Legacy Skill",
      hits: [makeHit({ physMultiplier: 1, physFixed: 10 })],
    })
    kvStore.set("wwm.customSkills", JSON.stringify({ v: 3, skills: [legacy] }))
    const found = loadCustomSkillsForClass(CLASS).find((x) => x.id === legacy.id)
    expect(found).toBeTruthy()
    expect(found!.hits[0].variants).toBeUndefined()
    expect(found!.hits[0].triggers).toEqual([])
    expect(found!.hits[0].physMultiplier).toBe(1)
    expect(found!.hits[0].physFixed).toBe(10)
  })
})
