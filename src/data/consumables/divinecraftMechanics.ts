import type { Skill } from "../../engine/skill"
import type { MechanicEvent, MechanicSetup, TimelineMechanic } from "../../engine/mechanics/types"

type State = Record<string, never>

interface EnchantDotSpec {
  element: "fire" | "poison"
  skillId: string
  name: string
  windowSec: number
  physMultiplier: number
  qiRate: number
  qiFlat?: number
}

interface DotWindow {
  openAt: number
  endAt: number
}

const TICK_INTERVAL_SEC = 1
const FIRST_TICK_LEAD_SEC = 0.5

// In-game values as of 2026-09-11, 2026-10-06.
const FIRE_BURN: EnchantDotSpec = {
  element: "fire",
  skillId: "divinecraft-fire",
  name: "Divinecraft - Fire",
  windowSec: 4,
  physMultiplier: 0.26,
  qiRate: 0.6,
}

// In-game values as of 2026-10-06.
const POISONED: EnchantDotSpec = {
  element: "poison",
  skillId: "divinecraft-poison",
  name: "Divinecraft - Poison",
  windowSec: 8,
  physMultiplier: 0.16,
  qiRate: 1,
  qiFlat: 1,
}

// In-game values as of 2026-10-06.
const POISON_QI_DAMAGE_BOOST = 0.05
const EXPLOSION_NAME = "Divinecraft - Fire Explosion"
const EXPLOSION_PHYS_MULTIPLIER = 0.4
const STACK_DURATION_SEC = 5
const STACKS_FOR_COMBUSTION = 5
const COMBUSTION_DURATION_SEC = 5
const EXPLOSION_COOLDOWN_SEC = 5

function dotWindows(hitTimesSec: readonly number[], windowSec: number): DotWindow[] {
  const windows: DotWindow[] = []
  for (const hitTime of hitTimesSec) {
    const current = windows[windows.length - 1]
    if (current && hitTime < current.endAt) current.endAt = hitTime + windowSec
    else windows.push({ openAt: hitTime, endAt: hitTime + windowSec })
  }
  return windows
}

function dotTickTimesSec(
  hitTimesSec: readonly number[],
  windowSec: number,
  fightWindowEndSec: number,
): number[] {
  const ticks: number[] = []
  for (const window of dotWindows(hitTimesSec, windowSec)) {
    const windowEndSec = Math.min(window.endAt, fightWindowEndSec)
    for (
      let tickTimeSec = window.openAt + FIRST_TICK_LEAD_SEC;
      tickTimeSec < windowEndSec;
      tickTimeSec += TICK_INTERVAL_SEC
    ) {
      ticks.push(tickTimeSec)
    }
  }
  return ticks
}

function explosionTimesSec(hitTimesSec: readonly number[]): number[] {
  const explosions: number[] = []
  let stacks = 0
  let stacksExpireAt = 0
  let combustionEndAt: number | null = null
  let cooldownEndAt = 0
  for (const hitTime of hitTimesSec) {
    if (combustionEndAt !== null && hitTime >= combustionEndAt) combustionEndAt = null
    if (combustionEndAt !== null) {
      explosions.push(hitTime)
      combustionEndAt = null
      cooldownEndAt = hitTime + EXPLOSION_COOLDOWN_SEC
      continue
    }
    if (hitTime < cooldownEndAt) continue
    if (hitTime >= stacksExpireAt) stacks = 0
    stacks += 1
    stacksExpireAt = hitTime + STACK_DURATION_SEC
    if (stacks >= STACKS_FOR_COMBUSTION) {
      stacks = 0
      combustionEndAt = hitTime + COMBUSTION_DURATION_SEC
    }
  }
  return explosions
}

function buffDrivenSkill(classId: string, id: string, name: string): Skill {
  return {
    id,
    classId,
    name,
    breakdownName: name,
    skillType: "mindMethod",
    weaponOrAttribute: "",
    attributeAttack: "",
    hits: [],
    castFrames: 0,
    triggerable: false,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
  }
}

function fixedFormulaArt(name: string, physMultiplier: number) {
  return {
    name,
    physMultiplier,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    guaranteedNormal: 1,
    skillType: "mindMethod",
  }
}

function dotEvents(spec: EnchantDotSpec, setup: MechanicSetup): MechanicEvent[] {
  const skill = buffDrivenSkill(setup.classId, spec.skillId, spec.name)
  return dotTickTimesSec(
    setup.hitTimesSec,
    spec.windowSec,
    setup.windowStartSec + setup.rotationDurationSec,
  ).map((tickTimeSec) => ({
    frame: Math.round(tickTimeSec * setup.fps),
    skill,
    art: fixedFormulaArt(spec.name, spec.physMultiplier),
    name: spec.name,
    type: "mindMethod",
    qiRate: spec.qiRate,
    qiFlat: spec.qiFlat,
    qiHitKind: "dot" as const,
  }))
}

function explosionEvents(setup: MechanicSetup): MechanicEvent[] {
  const skill = buffDrivenSkill(setup.classId, "divinecraft-fire-explosion", EXPLOSION_NAME)
  return explosionTimesSec(setup.hitTimesSec).map((explosionTimeSec) => ({
    frame: Math.round(explosionTimeSec * setup.fps),
    skill,
    art: fixedFormulaArt(EXPLOSION_NAME, EXPLOSION_PHYS_MULTIPLIER),
    name: EXPLOSION_NAME,
    type: "mindMethod",
    qiRate: 1,
  }))
}

function prepareFor(element: EnchantDotSpec["element"]) {
  return (setup: MechanicSetup): State | null => (setup.inputs.divinecraft === element ? {} : null)
}

export function fireOilBurnMechanic(): TimelineMechanic<State> {
  return {
    id: "fireOilBurn",
    prepare: prepareFor("fire"),
    extraEvents: (_state, setup) => [...dotEvents(FIRE_BURN, setup), ...explosionEvents(setup)],
  }
}

export function toxicPowderPoisonedMechanic(): TimelineMechanic<State> {
  return {
    id: "toxicPowderPoisoned",
    prepare: prepareFor("poison"),
    contributeAt: () => ({
      effects: [{ statKey: "qiDamageBoost", amount: POISON_QI_DAMAGE_BOOST }],
    }),
    extraEvents: (_state, setup) => dotEvents(POISONED, setup),
  }
}
