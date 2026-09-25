import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs, TimelineEvent } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const HIT_NAME = "Probe Hit"

function probeInputs(hitSeconds: readonly number[], divinecraft: Inputs["divinecraft"]): Inputs {
  const hits = hitSeconds.map((sec) =>
    makeHit({ frame: Math.round(sec * 60), physMultiplier: 0.1 }),
  )
  const lastFrame = hits[hits.length - 1].frame
  const skill = makeSkill(CLASS, { name: HIT_NAME, castFrames: lastFrame + 60, hits })
  return {
    ...defaultInputs,
    classId: CLASS,
    set: null,
    divinecraft,
    // Isolate the +1.5% all-damage boost from the target's own baseline
    // damage-taken bonus, which the formula sums alongside it.
    dummyMode: true,
    customSkills: [skill],
    activeCustomRotation: makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] }),
  }
}

function probeHits(timeline: TimelineEvent[] | undefined): TimelineEvent[] {
  return (timeline ?? []).filter((event) => event.skillName === HIT_NAME)
}

describe("Divinecraft: Fire's +1.5% HP damage only lasts the 40 s enchant window", () => {
  it("boosts a hit landing before 40 s by exactly 1.5%", () => {
    const withFire = probeHits(runEngine(probeInputs([39], "fire")).timeline)
    const withoutFire = probeHits(runEngine(probeInputs([39], null)).timeline)
    expect(withFire[0].damage / withoutFire[0].damage).toBeCloseTo(1.015, 9)
  })

  it("does not boost a hit landing at or after 40 s", () => {
    const withFire = probeHits(runEngine(probeInputs([40], "fire")).timeline)
    const withoutFire = probeHits(runEngine(probeInputs([40], null)).timeline)
    expect(withFire[0].damage / withoutFire[0].damage).toBeCloseTo(1, 9)
  })
})
