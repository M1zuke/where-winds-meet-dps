// Build-driven buff enablement: a gated site buff turns on because the
// character's build selects the matching inner way or equips the matching
// gear set — never from a manual toggle. See `src/engine/buffs/params.ts` /
// `paramMap.ts`.
import { describe, it, expect } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { stat } from "../../src/engine/effects/effect"
import { allBuffDefsDeduped, groupBuffDefs } from "../../src/engine/buffs/data"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { zhongToTier } from "../../src/engine/buffs/paramMap"
import { makeSkill, makeHit } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { SET_ID } from "../../src/data/sets"

function taggedSkill(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("paramsFromInputs — build derivation", () => {
  const base: Inputs = {
    ...defaultInputs,
    mindMethods: [
      { ...emptyMindMethod },
      { ...emptyMindMethod },
      { ...emptyMindMethod },
      { ...emptyMindMethod },
    ],
  }

  it("a selected inner way enables its param at the slot's tier", () => {
    const inputs: Inputs = {
      ...base,
      classId: "bellstrikeUmbra",
      mindMethods: [
        { name: "Wolfchaser's Art", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
      set: SET_ID.shatteredRidge,
    }
    const params = paramsFromInputs(inputs)
    expect(params.wolfchasersArt).toBe(true)
    expect(params.wolfchasersArtTier).toBe(6)
    expect(params.armorSet).toBe("shatteredridge")
  })

  it("Insightful Strike is a documented overlap gap — it never enables insightfulStrike", () => {
    const inputs: Inputs = {
      ...base,
      classId: "bellstrikeUmbra",
      mindMethods: [
        { name: "Insightful Strike", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
    }
    const params = paramsFromInputs(inputs)
    expect(params.insightfulStrike).toBeUndefined()
    expect(params.insightfulStrikeTier).toBeUndefined()
  })

  it("Stars Align enables starsAlignActive", () => {
    const inputs: Inputs = { ...base, set: SET_ID.starsAlign }
    const params = paramsFromInputs(inputs)
    expect(params.starsAlignActive).toBe(true)
    expect(params.armorSet).toBe("starsAlign")
  })

  it("a class-signature inner way is enabled only when selected in a slot (no auto-enable)", () => {
    const unselected = paramsFromInputs({ ...base, classId: "bellstrikeUmbra" })
    expect(unselected.swordHorizon).toBeUndefined()
    expect(unselected.swordHorizonTier).toBeUndefined()

    const selected = paramsFromInputs({
      ...base,
      classId: "bellstrikeUmbra",
      mindMethods: [
        { name: "Sword Horizon", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
    })
    expect(selected.swordHorizon).toBe(true)
    expect(selected.swordHorizonTier).toBe(6)
  })

  it("a selected class-signature enables only its own param, not another class's", () => {
    const inputs: Inputs = {
      ...base,
      classId: "bellstrikeUmbra",
      mindMethods: [
        { name: "Sword Horizon", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
    }
    const params = paramsFromInputs(inputs)
    expect(params.swordHorizon).toBe(true)
    expect(params.combo).toBeUndefined()
  })

  it("the default build enables no gated buff param", () => {
    const params = paramsFromInputs({ ...defaultInputs, classId: "bellstrikeUmbra" })
    for (const [param, def] of Object.entries(params)) {
      if (
        param === "isTrainingDummy" ||
        param === "armorSet" ||
        param === "classId" ||
        param === "spec"
      )
        continue
      expect(def).toBeFalsy()
    }
  })
})

describe("zhongToTier", () => {
  it.each([
    ["tier 6", 6],
    ["tier 5", 5],
    ["tier 0", 0],
    ["", 0],
  ])("%s -> %d", (stacks, expected) => {
    expect(zhongToTier(stacks)).toBe(expected)
  })
})

describe("build-driven enablement moves timeline DPS", () => {
  function run(withInnerWay: boolean) {
    const trigger = makeSkill("bellstrikeUmbra", {
      name: "SpearQ",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 50 })],
    })
    const follow = makeSkill("bellstrikeUmbra", {
      name: "FollowUp",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 3, physFixed: 100 })],
    })
    const rotation = makeRotation("bellstrikeUmbra", {
      steps: [
        makeStep({ skillId: trigger.id, hitCount: 1 }),
        makeStep({ skillId: follow.id, hitCount: 1 }),
      ],
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      customSkills: [trigger, follow],
      customBuffs: [],
      customDebuffs: [],
      activeCustomRotation: rotation,
      mindMethods: withInnerWay
        ? [
            { name: "Wolfchaser's Art", stacks: "tier 6" },
            { ...emptyMindMethod },
            { ...emptyMindMethod },
            { ...emptyMindMethod },
          ]
        : [
            { ...emptyMindMethod },
            { ...emptyMindMethod },
            { ...emptyMindMethod },
            { ...emptyMindMethod },
          ],
    }
    return simulateTimeline(inputs).perSkill.find((s) => s.name === "FollowUp")!.expectedDamage
  }

  it("selecting Wolfchaser's Art lifts the follow-up hit inside potentRiverFlow's window", () => {
    expect(run(true)).toBeGreaterThan(run(false))
  })
})

describe("set enablement registers a requiresSet buff", () => {
  it("Jadeware registers jadeware; Hawking does not", () => {
    const withSet = new BuffEngine(
      paramsFromInputs({ ...defaultInputs, set: SET_ID.jadeware }),
      allBuffDefsDeduped(),
      groupBuffDefs(),
    )
    expect(withSet.definitions.has("jadeware")).toBe(true)

    const withoutSet = new BuffEngine(
      paramsFromInputs({ ...defaultInputs, set: SET_ID.hawking }),
      allBuffDefsDeduped(),
      groupBuffDefs(),
    )
    expect(withoutSet.definitions.has("jadeware")).toBe(false)
  })
})

describe("time-windowed application", () => {
  it("a buff only affects hits cast inside its duration window", () => {
    const modules: BuffModule[] = [
      {
        id: "windowed",
        name: "Windowed",
        triggeredBy: ["X"],
        duration: 10,
        affects: null,
        effects: [stat("allDamageBoost", 0.2)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    engine.processSkillCast("X", 0, {})
    expect(engine.calculateDamageEffects(taggedSkill("Y"), 5).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.2,
    })
    expect(engine.calculateDamageEffects(taggedSkill("Y"), 11).effects).toHaveLength(0)
  })
})
