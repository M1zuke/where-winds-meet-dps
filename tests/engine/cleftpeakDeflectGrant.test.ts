import { describe, expect, it } from "vitest"
import { cleftpeakDeflectGrant } from "../../src/data/skills/buffs/cleftpeakDeflectGrant"
import { BUFF } from "../../src/data/skills/buffs/ids"
import type { Effect } from "../../src/engine/effects/effect"

describe("a successful Cleftpeak deflect grants the full 5 stacks", () => {
  const effects = cleftpeakDeflectGrant.effects as Effect[]

  it.each([BUFF.cleftpeakStacks, BUFF.cleftpeakDeflect])("grants 5 stacks of %s", (targetId) => {
    const effect = effects.find(
      (candidate): candidate is Extract<Effect, { kind: "applyBuff" }> =>
        candidate.kind === "applyBuff" && candidate.id === targetId,
    )
    expect(effect?.stacks).toBe(5)
  })
})
