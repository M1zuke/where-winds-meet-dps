import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V45__castLengthAndHitFrameRepairs,
  healSkillFrames,
} from "../../src/migrations/customSkills/V45__castLengthAndHitFrameRepairs"
import { loadCustomSkills } from "../../src/storage"
import storeV44File from "./testCustomSkills/v44/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV44File as unknown as RawCustomSkillsBlob

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string) =>
  (blob.skills as Record<string, unknown>[]).find((skill) => skill.id === id)

const hitAt = (skill: Record<string, unknown>, index: number) =>
  (skill.hits as Record<string, unknown>[])[index]

function skillOf(id: string, castFrames: number, hits: Record<string, unknown>[]) {
  return { id, castFrames, hits }
}

describe("healSkillFrames", () => {
  it("moves the universal Deflect Cancel length from 25 to 18 for every class but leaves Bamboocut Draught's own 26 alone", () => {
    const umbra = skillOf("bellstrikeUmbra-deflect-cancel", 25, [{ frame: 0 }])
    expect((healSkillFrames(clone(umbra)) as Record<string, unknown>).castFrames).toBe(18)

    const draught = skillOf("bamboocutDraught-deflect-cancel", 26, [{ frame: 0 }])
    expect((healSkillFrames(clone(draught)) as Record<string, unknown>).castFrames).toBe(26)
  })

  it("moves Silkbind Jade's own Deflect Cancel from either universal value to 12", () => {
    const fromOld = skillOf("silkbindJade-deflect-cancel", 25, [{ frame: 0 }])
    expect((healSkillFrames(clone(fromOld)) as Record<string, unknown>).castFrames).toBe(12)

    const fromUniversalFixed = skillOf("silkbindJade-deflect-cancel", 18, [{ frame: 0 }])
    expect((healSkillFrames(clone(fromUniversalFixed)) as Record<string, unknown>).castFrames).toBe(
      12,
    )
  })

  it("moves Golden Body's two forms to their shared 45-frame cast for every class", () => {
    const cancel = skillOf("bamboocutDraught-golden-body-cancel", 0, [{ frame: 0 }])
    expect((healSkillFrames(clone(cancel)) as Record<string, unknown>).castFrames).toBe(45)
    const deflectCancel = skillOf("silkbindJade-golden-body-deflect-cancel", 22, [{ frame: 0 }])
    expect((healSkillFrames(clone(deflectCancel)) as Record<string, unknown>).castFrames).toBe(45)
  })

  it("re-splits Leaping Toad's two hits onto their in-game frames and coefficients", () => {
    const before = skillOf("mystic-toad-cancel", 72, [
      {
        frame: 0,
        physMultiplier: 1.8922,
        attributeMultiplier: 2.8383,
        physFixed: 284.31,
        attributeFixed: 0,
      },
      {
        frame: 36,
        physMultiplier: 1.8922,
        attributeMultiplier: 2.8383,
        physFixed: 284.31,
        attributeFixed: 0,
      },
    ])
    const healed = healSkillFrames(clone(before)) as Record<string, unknown>
    expect(healed.castFrames).toBe(96)
    expect(hitAt(healed, 0)).toMatchObject({ frame: 39, physMultiplier: 0.54063, physFixed: 81.23 })
    expect(hitAt(healed, 1)).toMatchObject({
      frame: 68,
      physMultiplier: 3.24377,
      physFixed: 487.39,
    })
  })

  it("re-splits Soaring Spin's two hits, and moves the 1-hit form's own hit, onto their in-game frames", () => {
    const before = skillOf("mystic-soaring", 120, [
      {
        frame: 0,
        physMultiplier: 3.55121,
        attributeMultiplier: 5.326815,
        physFixed: 535.03,
        attributeFixed: 0,
      },
      {
        frame: 60,
        physMultiplier: 3.55121,
        attributeMultiplier: 5.326815,
        physFixed: 535.03,
        attributeFixed: 0,
      },
    ])
    const healed = healSkillFrames(clone(before)) as Record<string, unknown>
    expect(healed.castFrames).toBe(122)
    expect(hitAt(healed, 0)).toMatchObject({ frame: 48, physMultiplier: 3.19609 })
    expect(hitAt(healed, 1)).toMatchObject({ frame: 122, physMultiplier: 3.90633 })

    const before1Hit = skillOf("mystic-soaring-1-hit", 60, [
      {
        frame: 0,
        physMultiplier: 3.19609,
        attributeMultiplier: 4.794135,
        physFixed: 481.53,
        attributeFixed: 0,
      },
    ])
    const healed1Hit = healSkillFrames(clone(before1Hit)) as Record<string, unknown>
    expect(healed1Hit.castFrames).toBe(76)
    expect(hitAt(healed1Hit, 0)).toMatchObject({ frame: 48 })
  })

  it("moves Dragon's Breath's plain 2-hit form's cast and hit frames, and its second hit's Combustion extension", () => {
    const before = skillOf("mystic-fire-breath-2-hit", 100, [
      {
        frame: 40,
        physMultiplier: 1.40692,
        triggers: [{ kind: "applyDebuff", targetId: "x", extendFrames: 90 }],
      },
      {
        frame: 70,
        physMultiplier: 1.40692,
        triggers: [{ kind: "applyDebuff", targetId: "x", extendFrames: 60, extendOnly: true }],
      },
      {
        frame: 100,
        physMultiplier: 1.40692,
        triggers: [{ kind: "applyDebuff", targetId: "x", extendFrames: 90, extendOnly: true }],
      },
    ])
    const healed = healSkillFrames(clone(before)) as Record<string, unknown>
    expect(healed.castFrames).toBe(137)
    expect(hitAt(healed, 0).frame).toBe(36)
    expect(hitAt(healed, 1).frame).toBe(102)
    expect(hitAt(healed, 2).frame).toBe(108)
    expect((hitAt(healed, 1).triggers as Record<string, unknown>[])[0].extendFrames).toBe(90)
  })

  it("moves Flute of the Tides' strike from the second hit onto the first, together with its ripple trigger", () => {
    const before = skillOf("mystic-flute-of-the-tides-full", 162, [
      {
        frame: 0,
        physMultiplier: 3.93721,
        attributeMultiplier: 5.905815,
        physFixed: 855.92,
        attributeFixed: 0,
        triggers: [],
      },
      {
        frame: 81,
        physMultiplier: 3.93721,
        attributeMultiplier: 5.905815,
        physFixed: 855.92,
        attributeFixed: 0,
        triggers: [{ kind: "applyDebuff", targetId: "debuff-mystic-flute-ripple" }],
      },
    ])
    const healed = healSkillFrames(clone(before)) as Record<string, unknown>
    expect(healed.castFrames).toBe(162)
    expect(hitAt(healed, 0)).toMatchObject({
      frame: 78,
      physMultiplier: 1.47645,
      physFixed: 320.97,
    })
    expect((hitAt(healed, 0).triggers as unknown[]).length).toBe(1)
    expect(hitAt(healed, 1)).toMatchObject({ frame: 192, physMultiplier: 3.93721 })
    expect((hitAt(healed, 1).triggers as unknown[]).length).toBe(0)
  })

  it("leaves an already-edited Flute of the Tides copy alone, coefficients included", () => {
    const edited = skillIn(STORE, "mystic-flute-of-the-tides-full")!
    expect(healSkillFrames(clone(edited))).toEqual(edited)
  })

  it("adds the strike hit Flute of the Tides' cancel form was missing, at the ripple's own frame", () => {
    const before = skillOf("mystic-flute-of-the-tides-cancel", 81, [
      {
        id: "hv-flute-cancel-ripple",
        frame: 0,
        physMultiplier: 0,
        attributeMultiplier: 0,
        physFixed: 0,
        attributeFixed: 0,
        triggers: [{ kind: "applyDebuff", targetId: "debuff-mystic-flute-ripple" }],
      },
    ])
    const healed = healSkillFrames(clone(before)) as Record<string, unknown>
    expect((healed.hits as unknown[]).length).toBe(2)
    expect(hitAt(healed, 0).frame).toBe(78)
    expect(hitAt(healed, 1)).toMatchObject({
      frame: 78,
      physMultiplier: 1.47645,
      physFixed: 320.97,
    })
  })

  it("moves Hero's Blood's second strike back onto the first strike's own frame", () => {
    const before = skillOf("bamboocutDraught-heros-blood", 46, [
      { frame: 0, physMultiplier: 0, triggers: [] },
      { frame: 22, physMultiplier: 0.329365, triggers: [] },
      { frame: 33, physMultiplier: 0.329365, triggers: [] },
    ])
    const healed = healSkillFrames(clone(before)) as Record<string, unknown>
    expect(hitAt(healed, 0).frame).toBe(0)
    expect(hitAt(healed, 1).frame).toBe(33)
    expect(hitAt(healed, 2).frame).toBe(33)
  })

  it("moves the Primepick Follow-up cancel and the Reveldrift cancel to where the drink and the deflect are actually accepted", () => {
    const primepick = skillOf("bamboocutDraught-nightwick-primepick-follow-up-cancel", 21, [
      { frame: 20 },
    ])
    expect((healSkillFrames(clone(primepick)) as Record<string, unknown>).castFrames).toBe(39)

    const reveldrift = skillOf("bamboocutDraught-reveldrift-cancel", 28, [{ frame: 19 }])
    expect((healSkillFrames(clone(reveldrift)) as Record<string, unknown>).castFrames).toBe(21)
  })

  it("nudges Dragonquench - Inebriate's 2nd and 3rd combos onto their per-frame corrections", () => {
    const second = skillOf("bamboocutDraught-dragonquench-inebriate-second", 123, [
      { frame: 16 },
      { frame: 36 },
      { frame: 60 },
      { frame: 78 },
      { frame: 84 },
      { frame: 90 },
    ])
    const healedSecond = healSkillFrames(clone(second)) as Record<string, unknown>
    expect(healedSecond.castFrames).toBe(124)
    expect([0, 1, 2, 3, 4, 5].map((index) => hitAt(healedSecond, index).frame)).toEqual([
      16, 36, 60, 79, 85, 91,
    ])

    const thirdCancel = skillOf("bamboocutDraught-dragonquench-inebriate-third-cancel", 89, [
      { frame: 14 },
      { frame: 32 },
      { frame: 54 },
      { frame: 71 },
      { frame: 76 },
      { frame: 81 },
    ])
    const healedThirdCancel = healSkillFrames(clone(thirdCancel)) as Record<string, unknown>
    expect(healedThirdCancel.castFrames).toBe(89)
    expect([0, 1, 2, 3, 4, 5].map((index) => hitAt(healedThirdCancel, index).frame)).toEqual([
      14, 32, 53, 70, 75, 81,
    ])
  })

  it("moves Castlink's two hits and Peakfall's first hit onto their Jadeflush-shared frames", () => {
    const castlink = skillOf("bamboocutDraught-castlink", 49, [
      { frame: 14 },
      { frame: 28 },
      { frame: 41 },
      { frame: 74 },
    ])
    const healedCastlink = healSkillFrames(clone(castlink)) as Record<string, unknown>
    expect(hitAt(healedCastlink, 0).frame).toBe(15)
    expect(hitAt(healedCastlink, 1).frame).toBe(27)

    const peakfall = skillOf("bamboocutDraught-peakfall", 38, [{ frame: 20 }, { frame: 35 }])
    const healedPeakfall = healSkillFrames(clone(peakfall)) as Record<string, unknown>
    expect(hitAt(healedPeakfall, 0).frame).toBe(18)
  })

  it("extends Boundvessel to the full 1.6 s hold's own finish frames and adds its Endurance drain", () => {
    const hits = Array.from({ length: 12 }, (_, index) => ({ frame: index }))
    hits[10] = { frame: 124 }
    hits[11] = { frame: 140 }
    const before = skillOf("bamboocutDraught-boundvessel", 173, hits)
    const healed = healSkillFrames(clone(before)) as Record<string, unknown>
    expect(healed.castFrames).toBe(208)
    expect(hitAt(healed, 10).frame).toBe(144)
    expect(hitAt(healed, 11).frame).toBe(160)
    expect(healed.meterDrains).toEqual([
      { meterId: "endurance", perSecond: 15, fromFrame: 36, stopAfterSec: 1.6 },
    ])
  })

  it("does not add a second Endurance drain onto a copy that already carries one", () => {
    const before = {
      ...skillOf("bamboocutDraught-boundvessel", 208, [{ frame: 144 }, { frame: 160 }]),
      meterDrains: [{ meterId: "endurance", perSecond: 1, fromFrame: 0 }],
    }
    const healed = healSkillFrames(clone(before)) as Record<string, unknown>
    expect(healed.meterDrains).toEqual(before.meterDrains)
  })

  it("moves Second Track Slash's and Drifting Thrust's own meter drains onto their chargeRelease shape", () => {
    const cases: [string, Record<string, unknown>, Record<string, unknown>][] = [
      [
        "bellstrikeUmbra-sword-charge-stage-1-3-hit",
        { meterId: "endurance", perSecond: 14, fromFrame: 12 },
        {
          meterId: "endurance",
          perSecond: 14,
          fromFrame: 12,
          stopAfterSec: 0.3,
          chargeRelease: { fallbackSkillId: "bellstrikeUmbra-sword-charge-stage-1-level-0" },
        },
      ],
      [
        "bellstrikeUmbra-spearheavy-1-hit",
        { meterId: "endurance", perSecond: 20, fromFrame: 12, stopAfterSec: 1 },
        { meterId: "endurance", perSecond: 20, fromFrame: 18 },
      ],
      [
        "bellstrikeUmbra-spearheavy-stage-1",
        { meterId: "endurance", perSecond: 20, fromFrame: 12, stopAfterSec: 1 },
        {
          meterId: "endurance",
          perSecond: 20,
          fromFrame: 18,
          stopAfterSec: 0.2,
          chargeRelease: { fallbackSkillId: "bellstrikeUmbra-spearheavy-1-hit" },
        },
      ],
      [
        "bellstrikeUmbra-spearheavy",
        { meterId: "endurance", perSecond: 20, fromFrame: 12, stopAfterSec: 1 },
        {
          meterId: "endurance",
          perSecond: 20,
          fromFrame: 18,
          stopAfterSec: 1.2,
          chargeRelease: { fallbackSkillId: "bellstrikeUmbra-spearheavy-stage-1" },
        },
      ],
    ]
    for (const [id, fromDrain, toDrain] of cases) {
      const before = { ...skillOf(id, 60, [{ frame: 0 }]), meterDrains: [fromDrain] }
      const healed = healSkillFrames(clone(before)) as Record<string, unknown>
      expect(healed.meterDrains, id).toEqual([toDrain])
    }
  })

  it("never overwrites a charged-hold drain already moved off its own old shape", () => {
    const edited = {
      ...skillOf("bellstrikeUmbra-spearheavy", 60, [{ frame: 0 }]),
      meterDrains: [{ meterId: "endurance", perSecond: 99, fromFrame: 12, stopAfterSec: 1 }],
    }
    const healed = healSkillFrames(clone(edited)) as Record<string, unknown>
    expect(healed.meterDrains).toEqual(edited.meterDrains)
  })

  it("is idempotent on an already-healed charged-hold drain", () => {
    const before = {
      ...skillOf("bellstrikeUmbra-spearheavy", 60, [{ frame: 0 }]),
      meterDrains: [
        {
          meterId: "endurance",
          perSecond: 20,
          fromFrame: 18,
          stopAfterSec: 1.2,
          chargeRelease: { fallbackSkillId: "bellstrikeUmbra-spearheavy-stage-1" },
        },
      ],
    }
    const once = healSkillFrames(clone(before)) as Record<string, unknown>
    const twice = healSkillFrames(clone(once)) as Record<string, unknown>
    expect(twice.meterDrains).toEqual(once.meterDrains)
  })

  it("adds Sweep All's hit-1 River Flow and Spring Surge frame overrides, for the plain and the cancel form alike", () => {
    const hit1 = {
      frame: 16,
      variants: [
        { id: "hv-spearspecial-hit-1-river-flow", label: "River Flow" },
        { id: "hv-spearspecial-hit-1-spring-surge", label: "Spring Surge" },
      ],
    }
    for (const id of [
      "bellstrikeUmbra-spearspecial",
      "bellstrikeUmbra-spearspecial-1-hit-cancel",
    ]) {
      const before = skillOf(id, 60, [{ frame: 0 }, clone(hit1)])
      const healed = healSkillFrames(clone(before)) as Record<string, unknown>
      const variants = hitAt(healed, 1).variants as Record<string, unknown>[]
      expect(variants.map((variant) => variant.frame)).toEqual([18, 18])
    }
  })

  it("never overwrites a Sweep All hit-1 variant frame already moved off the seeded value", () => {
    const before = skillOf("bellstrikeUmbra-spearspecial", 60, [
      { frame: 0 },
      {
        frame: 16,
        variants: [{ id: "hv-spearspecial-hit-1-river-flow", label: "River Flow", frame: 20 }],
      },
    ])
    const healed = healSkillFrames(clone(before)) as Record<string, unknown>
    expect((hitAt(healed, 1).variants as Record<string, unknown>[])[0].frame).toBe(20)
  })

  it("adds the follow-up-gated hit 3 and hit 4 onto the 2-hit charge form, and hit 4 onto the 3-hit form", () => {
    const twoHit = skillOf("bellstrikeUmbra-sword-charge-stage-1-2-hit", 72, [
      { frame: 36 },
      { frame: 60 },
    ])
    const healedTwoHit = healSkillFrames(clone(twoHit)) as Record<string, unknown>
    expect((healedTwoHit.hits as unknown[]).length).toBe(4)
    expect(hitAt(healedTwoHit, 2)).toMatchObject({ id: "hit-2", frame: 70 })
    expect((hitAt(healedTwoHit, 2).requiresNextStepSkillIds as string[]).length).toBe(2)
    expect(hitAt(healedTwoHit, 3)).toMatchObject({
      id: "hit-3",
      frame: 80,
      castFramesWhenGated: 86,
    })

    const threeHit = skillOf("bellstrikeUmbra-sword-charge-stage-1-3-hit", 82, [
      { frame: 36 },
      { frame: 60 },
      { frame: 70 },
    ])
    const healedThreeHit = healSkillFrames(clone(threeHit)) as Record<string, unknown>
    expect((healedThreeHit.hits as unknown[]).length).toBe(4)
    expect(hitAt(healedThreeHit, 3)).toMatchObject({
      id: "hit-3",
      frame: 80,
      castFramesWhenGated: 86,
    })
  })

  it("is idempotent on the follow-up-gated charge-form hits", () => {
    const before = skillOf("bellstrikeUmbra-sword-charge-stage-1-2-hit", 72, [
      { frame: 36 },
      { frame: 60 },
    ])
    const once = healSkillFrames(clone(before)) as Record<string, unknown>
    const twice = healSkillFrames(clone(once)) as Record<string, unknown>
    expect(twice.hits).toEqual(once.hits)
  })

  it("never appends the follow-up-gated hits onto a charge form already edited past its own old hit count", () => {
    const edited = {
      ...skillOf("bellstrikeUmbra-sword-charge-stage-1-3-hit", 82, [
        { frame: 36 },
        { frame: 60 },
        { frame: 70 },
        { frame: 999 },
      ]),
    }
    const healed = healSkillFrames(clone(edited)) as Record<string, unknown>
    expect((healed.hits as unknown[]).length).toBe(4)
    expect(hitAt(healed, 3).frame).toBe(999)
  })

  it("shortens Perfect Dodge[Full] to its earliest next input", () => {
    const before = skillOf("bamboocutDraught-perfect-dodge-full", 50, [{ frame: 0 }])
    expect((healSkillFrames(clone(before)) as Record<string, unknown>).castFrames).toBe(25)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-crosswind-blade")!
    expect(healSkillFrames(clone(untouched))).toEqual(untouched)
  })

  it("never overwrites a cast length already moved off the old seeded value", () => {
    const edited = skillOf("mystic-toad-cancel", 999, [{ frame: 0 }, { frame: 36 }])
    expect((healSkillFrames(clone(edited)) as Record<string, unknown>).castFrames).toBe(999)
  })

  it("is idempotent", () => {
    const before = skillOf("mystic-soaring-1-hit", 60, [
      {
        frame: 0,
        physMultiplier: 3.19609,
        attributeMultiplier: 4.794135,
        physFixed: 481.53,
        attributeFixed: 0,
      },
    ])
    const once = healSkillFrames(clone(before))
    const twice = healSkillFrames(clone(once))
    expect(twice).toEqual(once)
  })
})

describe("V45__castLengthAndHitFrameRepairs — called directly", () => {
  it("does not mutate its input and stamps the blob at v45", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const result = V45__castLengthAndHitFrameRepairs.migrate(input)
    expect(input).toEqual(snapshot)
    expect(result.v).toBe(45)
  })
})

describe("V45__castLengthAndHitFrameRepairs — through the chain", () => {
  it("is registered and is exactly what the v44 → v45 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V45__castLengthAndHitFrameRepairs)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 45 })!
    expect(result.applied).toContain("V45__castLengthAndHitFrameRepairs")
    expect(result.blob.v).toBe(45)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V45__castLengthAndHitFrameRepairs,
    )
    const result = runChain(withoutStep, 45, clone(STORE))!
    expect(result.applied).not.toContain("V45__castLengthAndHitFrameRepairs")
  })
})

describe("a healed hit variant frame survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps Sweep All's hit-1 River Flow frame override after loadCustomSkills, not just after the migration step", () => {
    const baseHit = {
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      extraCritDamage: 0,
      triggers: [],
    }
    const blob = {
      v: 44,
      skills: [
        {
          id: "bellstrikeUmbra-spearspecial",
          classId: "bellstrikeUmbra",
          name: "Spear Special",
          skillType: "weapon",
          weaponOrAttribute: "Spear",
          attributeAttack: "Bellstrike",
          castFrames: 60,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          hits: [
            { ...baseHit, id: "hit-0", frame: 0 },
            {
              ...baseHit,
              id: "hit-1",
              frame: 16,
              variants: [
                {
                  ...baseHit,
                  id: "hv-spearspecial-hit-1-river-flow",
                  label: "River Flow",
                  conditions: [],
                },
              ],
            },
          ],
        },
      ],
    }
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(blob))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === "bellstrikeUmbra-spearspecial")!
    expect(skill.hits[1].variants?.[0].frame).toBe(18)
  })
})
