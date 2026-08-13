import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkillsForClass, builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import { seedSkillFromBuiltin } from "../../src/engine/skill"
import { seedDebuffFromBuiltin } from "../../src/engine/debuff"
import {
  saveCustomSkill,
  deleteCustomSkill,
  loadCustomSkillsForClass,
  saveCustomDebuff,
  loadCustomDebuffs,
  migrateDotStandinOverrides,
} from "../../src/storage"

function findBleedTickSkill() {
  const skill = builtinSkillsForClass("bellstrikeUmbra").find(
    (s) => s.id === "bellstrikeUmbra-bleed-tick",
  )
  if (!skill) throw new Error("expected the bellstrikeUmbra Bleed Tick skill to exist")
  return skill
}

function findBleedTickDebuff() {
  const debuff = builtinDebuffsForClass("bellstrikeUmbra").find(
    (d) => d.id === "debuff-bellstrikeUmbra-bleed-tick",
  )
  if (!debuff) throw new Error("expected the bellstrikeUmbra Bleeding debuff to exist")
  return debuff
}

function sumDotDamage(perSkill: { name: string; expectedDamage: number }[]): number {
  return perSkill
    .filter((p) => p.name.includes("(DoT)"))
    .reduce((sum, p) => sum + p.expectedDamage, 0)
}

describe("Bleed Tick sources its per-tick damage from the skill", () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it("the built-in skill's hits[0] shape equals the built-in debuff's dot shape (bit-exact anchor)", () => {
    const skill = findBleedTickSkill()
    const debuff = findBleedTickDebuff()
    const hit = skill.hits[0]
    expect(hit.physMultiplier).toBe(debuff.dot!.physMultiplier)
    expect(hit.attributeMultiplier).toBe(debuff.dot!.attributeMultiplier)
    expect(hit.physFixed).toBe(debuff.dot!.physFixed)
    expect(hit.attributeFixed).toBe(debuff.dot!.attributeFixed)
    expect(skill.attributeAttack).toBe(debuff.dot!.attributeAttack)
    expect(skill.attributeAttack).toBe("Bellstrike")
    expect(skill.weaponOrAttribute).toBe(debuff.dot!.weaponOrAttribute)
    expect(skill.weaponOrAttribute).toBe("Sword")
    expect(hit.physMultiplier).toBe(0.06864)
    expect(hit.attributeMultiplier).toBe(0.10296)
  })

  it("a no-op custom skill override reproduces the built-in output exactly", () => {
    const base = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })

    const skill = findBleedTickSkill()
    const clone = seedSkillFromBuiltin("bellstrikeUmbra", skill)
    const withNoop = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      customSkills: [clone],
    })

    expect(withNoop.dps).toBe(base.dps)
    expect(sumDotDamage(withNoop.perSkill)).toBe(sumDotDamage(base.perSkill))
  })

  it("editing the skill's hits changes the DoT DPS", () => {
    const base = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })

    const skill = findBleedTickSkill()
    const seeded = seedSkillFromBuiltin("bellstrikeUmbra", skill)
    seeded.hits = seeded.hits.map((h) => ({
      ...h,
      physMultiplier: h.physMultiplier * 3,
      attributeMultiplier: h.attributeMultiplier * 3,
    }))
    saveCustomSkill(seeded)

    const bumped = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      customSkills: loadCustomSkillsForClass("bellstrikeUmbra"),
    })

    expect(bumped.dps).toBeGreaterThan(base.dps)
    expect(sumDotDamage(bumped.perSkill)).toBeGreaterThan(sumDotDamage(base.perSkill))
  })

  it("deleting the custom skill reverts the DoT DPS to the built-in value", () => {
    const base = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })

    const skill = findBleedTickSkill()
    const seeded = seedSkillFromBuiltin("bellstrikeUmbra", skill)
    seeded.hits = seeded.hits.map((h) => ({ ...h, physMultiplier: h.physMultiplier * 3 }))
    saveCustomSkill(seeded)
    deleteCustomSkill(seeded.id)

    const reverted = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      customSkills: loadCustomSkillsForClass("bellstrikeUmbra"),
    })

    expect(reverted.dps).toBe(base.dps)
  })

  it("migrateDotStandinOverrides folds an old custom-debuff override onto the skill and drops the debuff, idempotently", () => {
    const debuff = findBleedTickDebuff()
    const seededDebuff = seedDebuffFromBuiltin("bellstrikeUmbra", debuff)
    seededDebuff.dot!.physMultiplier *= 3
    seededDebuff.dot!.attributeMultiplier *= 3
    saveCustomDebuff(seededDebuff)

    migrateDotStandinOverrides()

    expect(loadCustomDebuffs().some((d) => d.id === "debuff-bellstrikeUmbra-bleed-tick")).toBe(
      false,
    )

    const migratedSkills = loadCustomSkillsForClass("bellstrikeUmbra")
    const migratedSkill = migratedSkills.find((s) => s.id === "bellstrikeUmbra-bleed-tick")
    expect(migratedSkill).toBeTruthy()
    for (const hit of migratedSkill!.hits) {
      expect(hit.physMultiplier).toBeCloseTo(0.20592, 10)
      expect(hit.attributeMultiplier).toBeCloseTo(0.30888, 10)
    }

    const base = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })
    const withMigrated = runEngine({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      customSkills: migratedSkills,
    })
    expect(withMigrated.dps).toBeGreaterThan(base.dps)

    const beforeSecondRun = JSON.stringify(loadCustomSkillsForClass("bellstrikeUmbra"))
    const debuffsBeforeSecondRun = JSON.stringify(loadCustomDebuffs())
    migrateDotStandinOverrides()
    expect(JSON.stringify(loadCustomSkillsForClass("bellstrikeUmbra"))).toBe(beforeSecondRun)
    expect(JSON.stringify(loadCustomDebuffs())).toBe(debuffsBeforeSecondRun)
  })

  it("migrateDotStandinOverrides repairs a zeroed orphaned Bleed Tick skill from the built-in", () => {
    const skill = findBleedTickSkill()
    const zeroed = seedSkillFromBuiltin("bellstrikeUmbra", skill)
    zeroed.hits = zeroed.hits.map((h) => ({
      ...h,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }))
    saveCustomSkill(zeroed)

    migrateDotStandinOverrides()

    const repaired = loadCustomSkillsForClass("bellstrikeUmbra").find(
      (s) => s.id === "bellstrikeUmbra-bleed-tick",
    )
    expect(repaired).toBeTruthy()
    for (const hit of repaired!.hits) {
      expect(hit.physMultiplier).toBe(0.06864)
      expect(hit.attributeMultiplier).toBe(0.10296)
    }
  })
})
