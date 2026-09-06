import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { hiddenTimelineBuffIds } from "../../src/engine/buffs/catalog"
import { stat } from "../../src/engine/effects/effect"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import type { StatusView } from "../../src/engine/ledger"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"
import { builtinBuffsForClass } from "../../src/engine/builtinBuffs"

const GATE = "gate-under-test"

function statusView(active: boolean): StatusView {
  return {
    activeIdsAt: () => (active ? [GATE] : []),
    isActiveAt: (id) => active && id === GATE,
    stacksAt: (id) => (active && id === GATE ? 1 : 0),
    conditionStacksAt: (id) => (active && id === GATE ? 1 : 0),
    remainingFramesAt: () => undefined,
    windowsOf: () => [],
  }
}

const gated: BuffModule = {
  id: "gated-bonus",
  name: "Gated bonus",
  alwaysActive: true,
  affectsAll: true,
  duration: 9999,
  summary: "test",
  effects: (ctx) => (ctx.status.isActive(GATE) ? [stat("allDamageBoost", 0.2)] : []),
}

const marker: BuffModule = {
  id: "state-marker",
  name: "State marker",
  alwaysActive: true,
  affectsAll: true,
  duration: 9999,
  effects: [],
}

function engineWith(active: boolean) {
  const engine = new BuffEngine({}, [gated, marker])
  engine.attachStatuses({ view: statusView(active), fps: 60 })
  return engine
}

describe("a buff chip shows the effect the module applies, and appears only while it applies one", () => {
  it("a module gated on a ledger status is absent from the cast while the status is down", () => {
    const shown = engineWith(false).activeBuffsForDisplay(1)
    expect(shown.map((chip) => chip.id)).not.toContain(gated.id)
  })

  it("the same module appears with its effect once the status is up", () => {
    const shown = engineWith(true).activeBuffsForDisplay(1)
    const chip = shown.find((entry) => entry.id === gated.id)
    expect(chip?.effects).toEqual([{ statKey: "allDamageBoost", amount: 0.2 }])
  })

  it("a state marker declared with an empty effects array keeps its chip", () => {
    const shown = engineWith(false).activeBuffsForDisplay(1)
    expect(shown.map((chip) => chip.id)).toContain(marker.id)
  })

  it("a module's effects reach the damage formula through the same ledger gate", () => {
    const skill = {
      id: "s",
      classId: "c",
      name: "Anything",
      tags: [],
      skillType: "weapon",
      weaponOrAttribute: "",
      attributeAttack: "",
      hits: [],
      castFrames: 0,
      triggerable: false,
      createdAt: "",
      updatedAt: "",
    }
    const down = engineWith(false).calculateDamageEffects(skill, 1).effects
    const up = engineWith(true).calculateDamageEffects(skill, 1).effects
    expect(down).not.toContainEqual({ statKey: "allDamageBoost", amount: 0.2 })
    expect(up).toContainEqual({ statKey: "allDamageBoost", amount: 0.2 })
  })

  it("a bare unlock marker a build opens for the whole fight is hidden from every class's chips", () => {
    for (const classDef of CLASS_DEFS()) {
      const hidden = hiddenTimelineBuffIds(classDef.id)
      for (const gate of builtinBuffsForClass(classDef.id)) {
        const bareUnlock =
          gate.effects.length === 0 && gate.maxStacks === 1 && gate.defaultOpeningStacks === 1
        expect(hidden.has(gate.id)).toBe(bareUnlock)
      }
    }
  })
})
