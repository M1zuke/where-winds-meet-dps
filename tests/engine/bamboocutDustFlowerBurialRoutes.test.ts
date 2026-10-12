// Scoped to the Flower Burial route of two shared modules Bamboocut Dust reaches
// (docs/TESTING.md § "Class scoping"); Bamboocut Draught's Inebriate route keeps
// its own anchor in bamboocutDraughtProfile.test.ts.
import { describe, expect, it } from "vitest"
import {
  mistwingInebriatePenetration,
  mistwingLowTierTargetHealthPenetration,
  mistwingTargetHealthPenetration,
} from "../../src/data/innerWays/mistwingBuffs"
import { STATUS as DRAUGHT_STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { STATUS as DUST_STATUS } from "../../src/data/skills/bamboocut-dust/ids"
import { isFlowerBurial } from "../../src/data/skills/bamboocut-dust/buffs/flowerBurial"
import { tiltrimInebriateBonus } from "../../src/data/skills/buffs/tiltrimInebriateBonus"
import { tiltrimStack } from "../../src/data/skills/buffs/tiltrimStack"
import { BUFF } from "../../src/data/skills/buffs/ids"

interface StatusSetup {
  active?: readonly string[]
  secondsSinceEnd?: Record<string, number>
  tiltrimStacks?: number
}

function contextWith(setup: StatusSetup, tier = 6, remainingHealthFraction = 0.7) {
  const active = new Set(setup.active ?? [])
  return {
    self: { reachesEvent: true, stacks: 3 },
    status: {
      isActive: (id: string) => active.has(id),
      stacks: (id: string) => (id === BUFF.tiltrimStack ? (setup.tiltrimStacks ?? 0) : 0),
      secondsSinceLastEnd: (id: string) => setup.secondsSinceEnd?.[id] ?? null,
      secondsSinceStacksBelowThreshold: () => null,
    },
    build: { paramTier: () => tier },
    target: { remainingHealthFraction },
  } as never
}

function effectsOf(module: { effects: unknown }, context: never) {
  if (typeof module.effects !== "function")
    throw new Error("expected a context-dependent effect list")
  return (module.effects as (ctx: never) => unknown[])(context)
}

const inFlowerBurial: StatusSetup = { active: [DUST_STATUS.flowerBurial] }
const inInebriate: StatusSetup = { active: [DRAUGHT_STATUS.inebriateDeepdaze] }

describe("isFlowerBurial", () => {
  it("is true only while the Flower Burial status is up", () => {
    expect(isFlowerBurial(contextWith(inFlowerBurial))).toBe(true)
    expect(isFlowerBurial(contextWith({}))).toBe(false)
  })
})

describe("Tiltrim's stack bonus", () => {
  it("pays while Flower Burial is up", () => {
    expect(effectsOf(tiltrimStack, contextWith(inFlowerBurial))).not.toEqual([])
  })

  it("pays for up to 5.1 seconds after Flower Burial ends, and not after", () => {
    const justEnded = { secondsSinceEnd: { [DUST_STATUS.flowerBurial]: 5 } }
    const longEnded = { secondsSinceEnd: { [DUST_STATUS.flowerBurial]: 5.2 } }
    expect(effectsOf(tiltrimStack, contextWith(justEnded))).not.toEqual([])
    expect(effectsOf(tiltrimStack, contextWith(longEnded))).toEqual([])
  })

  it("pays nothing outside Flower Burial and Inebriate", () => {
    expect(effectsOf(tiltrimStack, contextWith({}))).toEqual([])
  })

  it("keeps paying while Inebriate", () => {
    expect(effectsOf(tiltrimStack, contextWith(inInebriate))).not.toEqual([])
  })

  it("leaves the 5-stack bonus to Inebriate, not Flower Burial", () => {
    const atFiveStacks = { ...inFlowerBurial, tiltrimStacks: 5 }
    expect(effectsOf(tiltrimInebriateBonus, contextWith(atFiveStacks))).toEqual([])
    expect(
      effectsOf(tiltrimInebriateBonus, contextWith({ ...inInebriate, tiltrimStacks: 5 })),
    ).not.toEqual([])
  })
})

describe("Mistwing's target-health bands", () => {
  const penetrationOf = (effects: unknown[]) =>
    (effects as { statKey: string; amount: number }[]).find(
      (effect) => effect.statKey === "phys.penetration",
    )?.amount

  it("doubles at tier 6 while Flower Burial is up", () => {
    const plain = effectsOf(mistwingTargetHealthPenetration, contextWith({}, 6, 0.7))
    const doubled = effectsOf(mistwingTargetHealthPenetration, contextWith(inFlowerBurial, 6, 0.7))
    expect(penetrationOf(doubled)).toBeCloseTo(penetrationOf(plain)! * 2, 10)
  })

  it("doubles below tier 6 from tier 3 while Flower Burial is up", () => {
    const plain = effectsOf(mistwingLowTierTargetHealthPenetration, contextWith({}, 3, 0.7))
    const doubled = effectsOf(
      mistwingLowTierTargetHealthPenetration,
      contextWith(inFlowerBurial, 3, 0.7),
    )
    const tierTwo = effectsOf(
      mistwingLowTierTargetHealthPenetration,
      contextWith(inFlowerBurial, 2, 0.7),
    )
    expect(penetrationOf(doubled)).toBeCloseTo(penetrationOf(plain)! * 2, 10)
    expect(penetrationOf(tierTwo)).toBeCloseTo(penetrationOf(plain)!, 10)
  })

  it("leaves the tier-6 extra penetration to Inebriate, not Flower Burial", () => {
    expect(effectsOf(mistwingInebriatePenetration, contextWith(inFlowerBurial))).toEqual([])
    expect(effectsOf(mistwingInebriatePenetration, contextWith(inInebriate))).not.toEqual([])
  })
})
