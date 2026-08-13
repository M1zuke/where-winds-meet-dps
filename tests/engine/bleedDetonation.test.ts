import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkillsForClass, defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { simulateTimeline } from "../../src/engine/timeline"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"

describe("bleed detonation — bellstrikeUmbra default rotation", () => {
  it("fires at least one Blood Burst hit", () => {
    const result = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })
    const detonationRow = result.perSkill.find((p) => p.name === "Blood Burst")
    expect(detonationRow).toBeTruthy()
    expect(detonationRow!.count).toBeGreaterThanOrEqual(1)
    expect(detonationRow!.expectedDamage).toBeGreaterThan(0)
  })

  it("only detonates once bleed reaches 5 stacks (6 hits of a canDetonate 3-hit skill ⇒ exactly 1 detonation)", () => {
    const swordSpecial3 = builtinSkillsForClass("bellstrikeUmbra").find(
      (s) => s.name === "SwordSpecial 3-Hit",
    )!
    expect(swordSpecial3).toBeTruthy()
    const rotation = makeRotation("bellstrikeUmbra", {
      steps: [
        makeStep({ skillId: swordSpecial3.id, hitCount: 3 }),
        makeStep({ skillId: swordSpecial3.id, hitCount: 3 }),
      ],
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    const detonationRow = result.perSkill.find((p) => p.name === "Blood Burst")
    expect(detonationRow).toBeTruthy()
    expect(detonationRow!.count).toBe(1)

    const detonationEvents = result.timeline!.filter((ev) => ev.skillName === "Blood Burst")
    expect(detonationEvents).toHaveLength(1)
    expect(detonationEvents[0].frame).toBe(80)
  })

  it("retains 2 stacks (instead of resetting to 0) at swordHorizon tier 6 — a second detonation follows 3 hits sooner", () => {
    const swordSpecial3 = builtinSkillsForClass("bellstrikeUmbra").find(
      (s) => s.name === "SwordSpecial 3-Hit",
    )!
    const rotation = makeRotation("bellstrikeUmbra", {
      steps: [
        makeStep({ skillId: swordSpecial3.id, hitCount: 3 }),
        makeStep({ skillId: swordSpecial3.id, hitCount: 3 }),
        makeStep({ skillId: swordSpecial3.id, hitCount: 3 }),
      ],
    })
    const below6: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
      mindMethods: [
        { name: "Sword Horizon", stacks: "tier 5" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
    }
    const at6: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
      mindMethods: [
        { name: "Sword Horizon", stacks: "tier 6" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
    }
    const belowResult = simulateTimeline(below6)
    const atResult = simulateTimeline(at6)
    expect(belowResult.perSkill.find((p) => p.name === "Blood Burst")!.count).toBe(1)
    expect(atResult.perSkill.find((p) => p.name === "Blood Burst")!.count).toBe(2)

    const noInnerWay: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
      mindMethods: [
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
    }
    const noneResult = simulateTimeline(noInnerWay)
    expect(noneResult.perSkill.find((p) => p.name === "Blood Burst")!.count).toBe(1)
  })

  it("increases bellstrikeUmbra's total DPS relative to a build with detonation triggers stripped", () => {
    const rotation = defaultRotationForClass("bellstrikeUmbra")!
    const withDetonation = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
    }).dps

    const strippedSkills = builtinSkillsForClass("bellstrikeUmbra").map((s) => ({
      ...s,
      hits: s.hits.map((h) => ({
        ...h,
        triggers: h.triggers.filter((t) => t.kind !== "detonateDot"),
      })),
    }))
    const without = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      customSkills: strippedSkills,
      activeCustomRotation: rotation,
    }).dps

    expect(withDetonation).toBeGreaterThan(without)
  })

  it("the default rotation still yields non-zero DPS (no regression)", () => {
    expect(runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" }).dps).toBeGreaterThan(0)
  })
})

describe("bleed detonation — Sword Martial QQQ", () => {
  const skillNamed = (name: string) => {
    const skill = builtinSkillsForClass("bellstrikeUmbra").find((s) => s.name === name)
    if (!skill) throw new Error(`no built-in skill "${name}"`)
    return skill
  }
  const detonations = (names: string[]) => {
    const steps = names.map((n) => {
      const s = skillNamed(n)
      return makeStep({ skillId: s.id, hitCount: s.hits.length })
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: makeRotation("bellstrikeUmbra", { name: names.join("+"), steps }),
    }
    return simulateTimeline(inputs).timeline!.filter((ev) => ev.skillName === "Blood Burst").length
  }

  it("carries apply + detonate on every hit", () => {
    for (const hit of skillNamed("Sword Martial QQQ").hits) {
      const kinds = hit.triggers.map((t) => t.kind)
      expect(kinds).toContain("applyDot")
      expect(kinds).toContain("detonateDot")
    }
  })

  it("detonates once its 2 bleed stacks carry the debuff to 5, but not on its own", () => {
    expect(detonations(["Sword Martial QQQ"])).toBe(0)
    expect(detonations(["Sword Martial QQ", "Sword Martial QQQ"])).toBe(1)
  })

  it("is the skill that detonates — the same stack count without it does not", () => {
    expect(detonations(["Sword Martial QQ", "Sword Martial QQ 2-Hit[Cancel]"])).toBe(0)
  })
})

describe("Sword R Charge follow-up", () => {
  const FULL = "Sword R Charge - Follow Up"
  const CANCEL = "Sword R Charge - Follow Up 1-Hit[cancel]"
  const skillNamed = (name: string) => {
    const skill = builtinSkillsForClass("bellstrikeUmbra").find((s) => s.name === name)
    if (!skill) throw new Error(`no built-in skill "${name}"`)
    return skill
  }
  const total = (name: string, field: "physMultiplier" | "attributeMultiplier" | "physFixed") =>
    skillNamed(name).hits.reduce((a, h) => a + h[field], 0)

  it("carries the workbook's Crisscross - Second Track coefficients, split across 2 hits", () => {
    expect(skillNamed(FULL).hits).toHaveLength(2)
    expect(total(FULL, "physMultiplier")).toBeCloseTo(0.8133, 10)
    expect(total(FULL, "attributeMultiplier")).toBeCloseTo(1.21995, 10)
    expect(total(FULL, "physFixed")).toBe(0)
    for (const hit of skillNamed(FULL).hits) {
      expect(hit.physMultiplier).toBeCloseTo(0.8133 / 2, 10)
      expect(hit.attributeMultiplier).toBeCloseTo(1.21995 / 2, 10)
    }
  })

  it("the 1-hit cancel is exactly half the full follow-up", () => {
    expect(skillNamed(CANCEL).hits).toHaveLength(1)
    expect(total(CANCEL, "physMultiplier")).toBeCloseTo(total(FULL, "physMultiplier") / 2, 10)
    expect(total(CANCEL, "attributeMultiplier")).toBeCloseTo(
      total(FULL, "attributeMultiplier") / 2,
      10,
    )
    expect(total(CANCEL, "physFixed")).toBe(0)
  })

  it("both apply bleed and can detonate it, like the Crosswind Blade follow-up they mirror", () => {
    for (const name of [FULL, CANCEL]) {
      for (const hit of skillNamed(name).hits) {
        const kinds = hit.triggers.map((t) => t.kind)
        expect(kinds).toContain("applyDot")
        expect(kinds).toContain("detonateDot")
      }
    }
  })

  it("detonates once the bleed stacks it adds carry the debuff to 5", () => {
    const steps = ["Sword Martial QQ", FULL].map((n) => {
      const s = skillNamed(n)
      return makeStep({ skillId: s.id, hitCount: s.hits.length })
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: makeRotation("bellstrikeUmbra", { name: "qq+followup", steps }),
    }
    const events = simulateTimeline(inputs).timeline!.filter((ev) => ev.skillName === "Blood Burst")
    expect(events).toHaveLength(1)
  })
})

describe("Sword Charge Stage 1, 3-Hit", () => {
  const NAME = "Sword Charge Stage 1, 3-Hit"
  const skillNamed = (name: string) => {
    const s = builtinSkillsForClass("bellstrikeUmbra").find((x) => x.name === name)
    if (!s) throw new Error(`no built-in skill "${name}"`)
    return s
  }

  it("carries the workbook's first-3-hits row, split across 3 hits", () => {
    const s = skillNamed(NAME)
    expect(s.hits).toHaveLength(3)
    const sum = (f: "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed") =>
      s.hits.reduce((a, h) => a + h[f], 0)
    expect(sum("physMultiplier")).toBeCloseTo(0.94015, 10)
    expect(sum("attributeMultiplier")).toBeCloseTo(1.41025, 10)
    expect(sum("physFixed")).toBeCloseTo(260, 10)
    expect(sum("attributeFixed")).toBeCloseTo(141.5, 10)
  })

  it("sits below the 4-hit and 5-hit cancels it shares a charge with", () => {
    const total = (name: string) => skillNamed(name).hits.reduce((a, h) => a + h.physMultiplier, 0)
    expect(total(NAME)).toBeLessThan(total("Sword Charge Stage 1, 4-Hit"))
    expect(total("Sword Charge Stage 1, 4-Hit")).toBeLessThan(total("Sword Charge Stage 1, 5-Hit"))
  })

  it("applies one bleed stack per hit, and cannot detonate on its own", () => {
    for (const hit of skillNamed(NAME).hits) {
      const kinds = hit.triggers.map((t) => t.kind)
      expect(kinds).toContain("applyDot")
      expect(kinds).not.toContain("detonateDot")
    }
  })
})
