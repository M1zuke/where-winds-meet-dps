// Scoped to Bamboocut Draught's built-in dummy rotation (docs/TESTING.md
// § "Class scoping"): the hit counts of a 60 s training-dummy run read from
// the in-game damage log (2026-09-05), one row per breakdown name. Damage is
// not asserted here — that is the anchor's job, bamboocutDraughtProfile.test.ts.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { importProfile } from "../../src/storage"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import profileFile from "./bamboocutDraughtMeasured.profile.json"

const IN_GAME_HITS: Record<string, number> = {
  "Dragonquench - Inebriate": 72,
  "Hero's Blood - Inebriate": 44,
  "Drunkslay State": 3,
  Castlink: 12,
  Whaledraft: 18,
  "Nightwick - Primepick": 6,
  "Hero's Blood": 8,
  // The cancel form's own strike (in-game values as of 2026-09-24) was not
  // yet modelled when this log was captured, so its own hit count reads one
  // higher than the captured log.
  "Flute Chanting a Thousand Waves": 11,
}

// Not folded into IN_GAME_HITS: docs/TIMELINE.md § "Fight window" now scores
// the rotation's own pre-pull Peakfall, so the model reads one higher than
// the captured log — open owner question whether the log's 5 already
// includes that pre-pull hit.
const LOGGED_PEAKFALL_HITS = 5

function runDummyRotation() {
  const profile = importProfile(JSON.stringify(profileFile))
  return runEngine(applyBowSet(applyArmorSet(withDerivedStats(profile.inputs))))
}

function loggedHitsByRow(
  result: ReturnType<typeof runEngine>,
  { damagingOnly }: { damagingOnly: boolean },
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of result.perSkill) {
    if (damagingOnly && row.expectedDamage <= 0) continue
    const name = row.breakdownName ?? row.name
    counts[name] = (counts[name] ?? 0) + row.count
  }
  return counts
}

describe("the dummy rotation against the in-game damage log", () => {
  const result = runDummyRotation()
  const hits = loggedHitsByRow(result, { damagingOnly: true })
  const rowsAsTheOverviewSumsThem = loggedHitsByRow(result, { damagingOnly: false })

  it("lands every hit the log books, row for row", () => {
    for (const [row, expected] of Object.entries(IN_GAME_HITS)) {
      expect(hits[row], row).toBe(expected)
    }
  })

  it("keeps grant-only casts out of the logged rows, so the overview shows the same counts", () => {
    for (const [row, expected] of Object.entries(IN_GAME_HITS)) {
      if (row === "Flute Chanting a Thousand Waves") continue
      expect(rowsAsTheOverviewSumsThem[row], row).toBe(expected)
    }
  })

  it("parries Reveldrift after its first hit, where the logged run let one second hit through", () => {
    expect(hits.Reveldrift).toBe(2)
  })

  it.fails(
    "Peakfall matches the in-game log (open: does the log's 5 include the pre-pull Peakfall?)",
    () => {
      expect(hits.Peakfall).toBe(LOGGED_PEAKFALL_HITS)
    },
  )

  it("runs the whole rotation in about a minute, as the log did", () => {
    expect(result.rotationDuration).toBeGreaterThan(62)
    expect(result.rotationDuration).toBeLessThan(62.6)
  })
})
