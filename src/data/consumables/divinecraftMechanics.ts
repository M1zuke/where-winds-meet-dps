import type { Skill } from "../../engine/skill"
import type {
  MechanicEvent,
  MechanicHost,
  MechanicSetup,
  TimelineMechanic,
} from "../../engine/mechanics/types"

interface EnchantDotSpec {
  element: "fire" | "poison"
  skillId: string
  name: string
  windowSec: number
  physMultiplier: number
  qiRate: number
  qiFlat?: number
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

// In-game values as of 2026-10-06, 2026-10-17.
const POISON_QI_DAMAGE_BOOST = 0.05
const EXPLOSION_NAME = "Divinecraft - Fire Explosion"
const EXPLOSION_PHYS_MULTIPLIER = 0.4
const STACK_DURATION_SEC = 5
const STACKS_FOR_COMBUSTION = 5
const COMBUSTION_DURATION_SEC = 5
const EXPLOSION_LOCKOUT_SEC = 10
const EXPLOSION_DELAY_FRAMES = 3

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

class EnchantDotChain {
  private readonly skill: Skill
  private windowEndSec = -Infinity
  private nextTickSec = 0
  private tickPending = false

  constructor(
    private readonly spec: EnchantDotSpec,
    setup: MechanicSetup,
  ) {
    this.skill = buffDrivenSkill(setup.classId, spec.skillId, spec.name)
  }

  owns(event: MechanicEvent): boolean {
    return event.skill.id === this.spec.skillId
  }

  onHit(timeSec: number, host: MechanicHost, setup: MechanicSetup): void {
    if (timeSec >= this.windowEndSec) {
      this.nextTickSec = timeSec + FIRST_TICK_LEAD_SEC
      this.tickPending = false
    }
    this.windowEndSec = timeSec + this.spec.windowSec
    this.arm(host, setup)
  }

  onTick(event: MechanicEvent, host: MechanicHost, setup: MechanicSetup): void {
    if (!this.tickPending || event.frame !== Math.round(this.nextTickSec * setup.fps)) return
    this.tickPending = false
    this.nextTickSec += TICK_INTERVAL_SEC
    this.arm(host, setup)
  }

  private arm(host: MechanicHost, setup: MechanicSetup): void {
    if (this.tickPending) return
    if (!(this.nextTickSec < this.windowEndSec)) return
    this.tickPending = true
    host.scheduleExtra({
      frame: Math.round(this.nextTickSec * setup.fps),
      skill: this.skill,
      art: fixedFormulaArt(this.spec.name, this.spec.physMultiplier),
      name: this.spec.name,
      type: "mindMethod",
      direct: false,
      qiRate: this.spec.qiRate,
      qiFlat: this.spec.qiFlat,
      qiHitKind: "dot" as const,
    })
  }
}

class FireExplosionTracker {
  private readonly skill: Skill
  private stacks = 0
  private stacksExpireAtFrame = Number.NEGATIVE_INFINITY
  private combustionEndFrame = Number.NEGATIVE_INFINITY
  private lockoutEndFrame = Number.NEGATIVE_INFINITY

  constructor(setup: MechanicSetup) {
    this.skill = buffDrivenSkill(setup.classId, "divinecraft-fire-explosion", EXPLOSION_NAME)
  }

  onHit(timeSec: number, host: MechanicHost, setup: MechanicSetup): void {
    const frame = Math.round(timeSec * setup.fps)
    const combustionWasUp = frame < this.combustionEndFrame
    if (frame >= this.stacksExpireAtFrame) this.stacks = 0
    this.stacks += 1
    this.stacksExpireAtFrame = frame + STACK_DURATION_SEC * setup.fps
    if (this.stacks >= STACKS_FOR_COMBUSTION) {
      this.stacks = 0
      this.combustionEndFrame = frame + COMBUSTION_DURATION_SEC * setup.fps
    }
    if (!combustionWasUp || frame < this.lockoutEndFrame) return
    this.lockoutEndFrame = frame + EXPLOSION_LOCKOUT_SEC * setup.fps
    host.scheduleExtra({
      frame: frame + EXPLOSION_DELAY_FRAMES,
      skill: this.skill,
      art: fixedFormulaArt(EXPLOSION_NAME, EXPLOSION_PHYS_MULTIPLIER),
      name: EXPLOSION_NAME,
      type: "mindMethod",
      direct: true,
      qiRate: 1,
    })
  }
}

interface FireState {
  burn: EnchantDotChain
  explosion: FireExplosionTracker
}

interface PoisonState {
  poison: EnchantDotChain
}

export function fireOilBurnMechanic(): TimelineMechanic<FireState> {
  return {
    id: "fireOilBurn",
    prepare: (setup) =>
      setup.inputs.divinecraft === "fire"
        ? {
            burn: new EnchantDotChain(FIRE_BURN, setup),
            explosion: new FireExplosionTracker(setup),
          }
        : null,
    observeEvent(state, event, setup, host) {
      if (!event.direct) return
      state.burn.onHit(event.timeSec, host, setup)
      state.explosion.onHit(event.timeSec, host, setup)
    },
    afterExtraEvent(state, event, host, setup) {
      if (state.burn.owns(event)) state.burn.onTick(event, host, setup)
    },
  }
}

export function toxicPowderPoisonedMechanic(): TimelineMechanic<PoisonState> {
  return {
    id: "toxicPowderPoisoned",
    prepare: (setup) =>
      setup.inputs.divinecraft === "poison"
        ? { poison: new EnchantDotChain(POISONED, setup) }
        : null,
    contributeAt: () => ({
      effects: [{ statKey: "qiDamageBoost", amount: POISON_QI_DAMAGE_BOOST }],
    }),
    observeEvent(state, event, setup, host) {
      if (!event.direct) return
      state.poison.onHit(event.timeSec, host, setup)
    },
    afterExtraEvent(state, event, host, setup) {
      if (state.poison.owns(event)) state.poison.onTick(event, host, setup)
    },
  }
}
