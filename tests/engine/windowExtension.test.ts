import { describe, expect, it } from "vitest"
import {
  EXTENSION_PARTICLES,
  WindowExtensionEnsemble,
  type BaseWindowOf,
  type WindowExtensionSpec,
} from "../../src/engine/buffs/windowExtension"
import { mulberry32 } from "../../src/engine/rng"

const WINDOW_ID = "mark"
const LATENESS_PROPERTY = "prop:timer"
const RUN_SPACING_SEC = 0.5
const LINGERING_BULLET_OFFSET_SEC = 0.15
const FAR_EXPIRY_SEC = 1000
const RUN_COUNT = 400

const baseWindowOf: BaseWindowOf = (buffId) =>
  buffId === WINDOW_ID ? { start: 0, expiresAt: FAR_EXPIRY_SEC } : null

const spec = (latenessMaxSec: number): WindowExtensionSpec => ({
  buffIds: [WINDOW_ID],
  bySec: 1,
  maxRemainingSec: 1e9,
  lateness: { property: LATENESS_PROPERTY, maxSec: latenessMaxSec },
})

function trigger(
  ensemble: WindowExtensionEnsemble,
  timeSec: number,
  runKey: string | null,
  latenessMaxSec: number,
) {
  ensemble.trigger(
    {
      timeSec,
      runKey,
      latenessMaxSec,
      conditionsHold: true,
      cooldownSec: 0.5,
      requiredWindowId: null,
    },
    baseWindowOf,
  )
}

function expectedExtensionSec(ensemble: WindowExtensionEnsemble): number {
  let total = 0
  const stepSec = 0.01
  for (let time = FAR_EXPIRY_SEC; time < FAR_EXPIRY_SEC + RUN_COUNT; time += stepSec)
    total += ensemble.liveFraction(WINDOW_ID, time, baseWindowOf) * stepSec
  return total
}

function extendingRunShare(latenessMaxSec: number, bulletOffsetsSec: readonly number[]): number {
  const ensemble = new WindowExtensionEnsemble(spec(latenessMaxSec))
  for (let run = 0; run < RUN_COUNT; run++) {
    const gridSec = 1 + run * RUN_SPACING_SEC
    for (const offsetSec of bulletOffsetsSec)
      trigger(ensemble, gridSec + offsetSec, `run-${run}`, latenessMaxSec)
  }
  return expectedExtensionSec(ensemble) / RUN_COUNT
}

describe("a timer-driven trigger chain against a 0.5 s cooldown", () => {
  it("extends about 63.2 % of the runs when each run fires one bullet", () => {
    expect(Math.abs(extendingRunShare(0.005, [0]) - 0.632)).toBeLessThan(0.01)
  })

  it("extends about 78.6 % of the runs when each run fires a second bullet 9 frames later", () => {
    const share = extendingRunShare(0.005, [0, LINGERING_BULLET_OFFSET_SEC])
    expect(Math.abs(share - 0.786)).toBeLessThan(0.01)
  })

  it("lands on the same share whatever the size of the lateness", () => {
    const shares = [0.001, 0.005, 0.03].map((size) => extendingRunShare(size, [0]))
    for (const share of shares) expect(Math.abs(share - shares[0])).toBeLessThan(0.02)
    const lingeringShares = [0.001, 0.005, 0.03].map((size) =>
      extendingRunShare(size, [0, LINGERING_BULLET_OFFSET_SEC]),
    )
    for (const share of lingeringShares)
      expect(Math.abs(share - lingeringShares[0])).toBeLessThan(0.02)
  })

  it("extends every run when the trigger has no lateness", () => {
    const ensemble = new WindowExtensionEnsemble(spec(0))
    for (let run = 0; run < 100; run++) trigger(ensemble, 1 + run * RUN_SPACING_SEC, null, 0)
    expect(Math.abs(expectedExtensionSec(ensemble) - 100)).toBeLessThan(0.5)
  })
})

describe("a supplied generator", () => {
  it("realises a single trajectory whose live fraction is 0 or 1", () => {
    const ensemble = new WindowExtensionEnsemble(spec(0.005), mulberry32(11))
    for (let run = 0; run < 20; run++)
      trigger(ensemble, 1 + run * RUN_SPACING_SEC, `run-${run}`, 0.005)
    for (let time = FAR_EXPIRY_SEC; time < FAR_EXPIRY_SEC + 20; time += 0.25) {
      const fraction = ensemble.liveFraction(WINDOW_ID, time, baseWindowOf)
      expect([0, 1]).toContain(fraction)
    }
  })

  it("uses one particle where the default uses the full ensemble", () => {
    expect(EXTENSION_PARTICLES).toBeGreaterThan(1)
    const single = new WindowExtensionEnsemble(spec(0.005), mulberry32(3))
    trigger(single, 1, "run", 0.005)
    expect(single.liveFraction(WINDOW_ID, FAR_EXPIRY_SEC + 0.5, baseWindowOf)).toBe(1)
  })
})
