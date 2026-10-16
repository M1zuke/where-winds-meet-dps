import type { MeterDef, MeterMaxContext } from "../definitions/resources/meterDef"
import {
  resolveMeterCapacity,
  resolveMeterStart,
  meterStatusId,
} from "../definitions/resources/meterDef"
import {
  conditionSatisfiedByStacks,
  hasBuffEngineSource,
  isStatusCondition,
  triggerConditions,
  type ConditionFailureReason,
  type HitTrigger,
  type MeterCost,
  type Skill,
  type SkillHit,
  type StatusCondition,
} from "./skill"

interface LateMeterCooldown {
  key: string
  frames: number
}

interface Branch {
  particles: Uint8Array | null
  amount: number
  firedAt: Map<string, number>
}

class LateMeterEnsemble {
  private branches: Branch[]
  private cursorFrame: number

  constructor(
    readonly def: MeterDef,
    readonly capacity: number,
    startFrame: number,
    startAmount: number,
    private readonly fps: number,
    private readonly particleCount: number,
  ) {
    this.cursorFrame = startFrame
    this.branches = [{ particles: null, amount: startAmount, firedAt: new Map() }]
  }

  advanceTo(frame: number): void {
    if (frame <= this.cursorFrame) return
    const regenerated = ((frame - this.cursorFrame) * this.def.regenPerSecond) / this.fps
    for (const branch of this.branches)
      branch.amount = Math.min(this.capacity, branch.amount + regenerated)
    this.cursorFrame = frame
  }

  spend(frame: number, amount: number): void {
    this.advanceTo(frame)
    for (const branch of this.branches) branch.amount -= Math.min(amount, branch.amount)
    this.merge()
  }

  gain(frame: number, amount: number, live: boolean | Uint8Array, cooldown?: LateMeterCooldown) {
    this.advanceTo(frame)
    if (live === false) return
    const next: Branch[] = []
    for (const branch of this.branches) {
      const [liveBranch, deadBranch] = live === true ? [branch, null] : this.split(branch, live)
      if (deadBranch) next.push(deadBranch)
      if (!liveBranch) continue
      const lastFiredAt = cooldown ? liveBranch.firedAt.get(cooldown.key) : undefined
      const cooling =
        cooldown !== undefined && lastFiredAt !== undefined && frame - lastFiredAt < cooldown.frames
      if (!cooling) {
        liveBranch.amount = Math.min(this.capacity, liveBranch.amount + amount)
        if (cooldown) liveBranch.firedAt.set(cooldown.key, frame)
      }
      next.push(liveBranch)
    }
    this.branches = next
    this.merge()
  }

  expectedAmount(): number {
    return this.branches.reduce((sum, branch) => sum + branch.amount * this.shareOf(branch), 0)
  }

  shareFailing(condition: StatusCondition): number {
    return this.branches.reduce(
      (sum, branch) =>
        conditionSatisfiedByStacks(condition, branch.amount) ? sum : sum + this.shareOf(branch),
      0,
    )
  }

  private membersOf(branch: Branch): Uint8Array {
    return branch.particles ?? new Uint8Array(this.particleCount).fill(1)
  }

  private shareOf(branch: Branch): number {
    if (!branch.particles) return 1
    return branch.particles.reduce((count, member) => count + member, 0) / this.particleCount
  }

  private split(branch: Branch, live: Uint8Array): [Branch | null, Branch | null] {
    const members = this.membersOf(branch)
    const liveMembers = new Uint8Array(this.particleCount)
    const deadMembers = new Uint8Array(this.particleCount)
    for (let particle = 0; particle < this.particleCount; particle++) {
      if (!members[particle]) continue
      if (live[particle]) liveMembers[particle] = 1
      else deadMembers[particle] = 1
    }
    if (!deadMembers.includes(1)) return [branch, null]
    if (!liveMembers.includes(1)) return [null, branch]
    return [
      { particles: liveMembers, amount: branch.amount, firedAt: new Map(branch.firedAt) },
      { particles: deadMembers, amount: branch.amount, firedAt: new Map(branch.firedAt) },
    ]
  }

  private merge(): void {
    const survivors = new Map<string, Branch>()
    for (const branch of this.branches) {
      const key = `${branch.amount}|${[...branch.firedAt].join(",")}`
      const survivor = survivors.get(key)
      if (!survivor) {
        survivors.set(key, branch)
        continue
      }
      const kept = this.membersOf(survivor)
      const joined = this.membersOf(branch)
      const union = kept.map((member, particle) => (member || joined[particle] ? 1 : 0))
      survivor.particles = union.every((member) => member === 1) ? null : union
    }
    this.branches = [...survivors.values()]
  }
}

export interface LateMeterStep {
  stepId: string
  skill: Skill
  startFrame: number
  prePull: boolean
}

export interface LateMeterHit {
  skill: Skill
  hit: SkillHit
  stepStart: number
  frame: number
  exactFrame: number
}

export interface LateMeterEnvironment {
  defs: readonly MeterDef[]
  fps: number
  startFrame: number
  maxContext: MeterMaxContext
  particleCount: number
  steps: readonly LateMeterStep[]
  hits: readonly LateMeterHit[]
  costApplies(cost: MeterCost): boolean
  delayedCostFrame(startFrame: number, atFrame: number): number
  castEndFrame(hit: LateMeterHit): number
  guardsHold(trigger: HitTrigger, frame: number): boolean
  liveParticles(buffId: string, frame: number): boolean | Uint8Array
}

export interface LateMeterSettlement {
  capacities: ReadonlyMap<string, number>
  levelBeforeCast: ReadonlyMap<string, ReadonlyMap<string, number>>
  illegalCasts: readonly { stepId: string; reasons: ConditionFailureReason[] }[]
}

interface LateMeterEvent {
  frame: number
  order: number
  sequence: number
  run(): void
}

const GAIN_ORDER = 0
const DELAYED_COST_ORDER = 0.5
const CAST_ORDER = 1
const CAST_COST_ORDER = 1.5

export function lateMeterStatusIds(defs: readonly MeterDef[]): ReadonlySet<string> {
  return new Set(defs.map((def) => meterStatusId(def.id)))
}

export function settleLateMeters(environment: LateMeterEnvironment): LateMeterSettlement {
  const ensembles = new Map(
    environment.defs.map((def) => {
      const capacity = resolveMeterCapacity(def, environment.maxContext)
      return [
        def.id,
        new LateMeterEnsemble(
          def,
          capacity,
          environment.startFrame,
          resolveMeterStart(def, capacity),
          environment.fps,
          environment.particleCount,
        ),
      ] as const
    }),
  )
  const ensembleByStatusId = new Map(
    [...ensembles.values()].map((ensemble) => [meterStatusId(ensemble.def.id), ensemble] as const),
  )
  const levelBeforeCast = new Map<string, Map<string, number>>()
  const illegalCasts: { stepId: string; reasons: ConditionFailureReason[] }[] = []
  const events: LateMeterEvent[] = []
  let sequence = 0

  for (const step of environment.steps) {
    if (step.prePull) continue
    for (const cost of step.skill.meterCosts ?? []) {
      const ensemble = ensembles.get(cost.meterId)
      if (!ensemble || !environment.costApplies(cost)) continue
      const frame =
        cost.atFrame === undefined
          ? step.startFrame
          : environment.delayedCostFrame(step.startFrame, cost.atFrame)
      events.push({
        frame,
        order: cost.atFrame === undefined ? CAST_COST_ORDER : DELAYED_COST_ORDER,
        sequence: sequence++,
        run: () => ensemble.spend(frame, cost.amount),
      })
    }
    events.push({
      frame: step.startFrame,
      order: CAST_ORDER,
      sequence: sequence++,
      run: () => {
        const levels = new Map<string, number>()
        for (const [meterId, ensemble] of ensembles) {
          ensemble.advanceTo(step.startFrame)
          levels.set(meterId, ensemble.expectedAmount())
        }
        levelBeforeCast.set(step.stepId, levels)
        const reasons: ConditionFailureReason[] = []
        for (const condition of step.skill.castConditions ?? []) {
          if (!isStatusCondition(condition)) continue
          const ensemble = ensembleByStatusId.get(condition.buffId)
          if (!ensemble || ensemble.shareFailing(condition) <= 0) continue
          reasons.push({
            kind: "meter",
            id: ensemble.def.id,
            name: ensemble.def.name,
            op: condition.op,
            required: condition.stacks,
            actual: ensemble.expectedAmount(),
            ...(ensemble.def.displayUnitSize !== undefined
              ? { unitSize: ensemble.def.displayUnitSize }
              : {}),
          })
        }
        if (reasons.length > 0) illegalCasts.push({ stepId: step.stepId, reasons })
      },
    })
  }

  const prePullStarts = new Set(
    environment.steps.filter((step) => step.prePull).map((step) => step.startFrame),
  )
  for (const landed of environment.hits) {
    if (prePullStarts.has(landed.stepStart)) continue
    landed.hit.triggers.forEach((trigger, triggerIndex) => {
      const ensemble = trigger.kind === "meterDelta" ? ensembles.get(trigger.targetId) : undefined
      if (!ensemble) return
      const frame = trigger.appliesOnCastEnd
        ? environment.castEndFrame(landed)
        : trigger.delayFrames !== undefined
          ? Math.round(landed.exactFrame + trigger.delayFrames)
          : landed.frame
      const engineConditions = triggerConditions(trigger)
        .filter(isStatusCondition)
        .filter(hasBuffEngineSource)
      const ledgerGuarded: HitTrigger = {
        ...trigger,
        condition:
          trigger.condition && hasBuffEngineSource(trigger.condition) ? null : trigger.condition,
        conditions: trigger.conditions?.filter((condition) => !hasBuffEngineSource(condition)),
        cooldownFrames: undefined,
      }
      const cooldown =
        trigger.cooldownFrames === undefined
          ? undefined
          : {
              key: trigger.cooldownGroup ?? `${landed.skill.id}|${landed.hit.id}|${triggerIndex}`,
              frames: trigger.cooldownFrames,
            }
      events.push({
        frame,
        order: GAIN_ORDER,
        sequence: sequence++,
        run: () => {
          if (!environment.guardsHold(ledgerGuarded, frame)) return
          const live = engineConditions.reduce<boolean | Uint8Array>(
            (alive, condition) =>
              combineLiveness(
                alive,
                livenessSatisfying(
                  condition,
                  environment.liveParticles(condition.buffId, landed.frame),
                ),
              ),
            true,
          )
          ensemble.gain(frame, trigger.stacks, live, cooldown)
        },
      })
    })
  }

  events.sort(
    (left, right) =>
      left.frame - right.frame || left.order - right.order || left.sequence - right.sequence,
  )
  for (const event of events) event.run()
  return {
    capacities: new Map([...ensembles].map(([meterId, ensemble]) => [meterId, ensemble.capacity])),
    levelBeforeCast,
    illegalCasts,
  }
}

function livenessSatisfying(
  condition: StatusCondition,
  live: boolean | Uint8Array,
): boolean | Uint8Array {
  const whenLive = conditionSatisfiedByStacks(condition, 1)
  const whenDown = conditionSatisfiedByStacks(condition, 0)
  if (whenLive === whenDown) return whenLive
  if (whenLive) return live
  return typeof live === "boolean" ? !live : live.map((member) => (member ? 0 : 1))
}

function combineLiveness(
  left: boolean | Uint8Array,
  right: boolean | Uint8Array,
): boolean | Uint8Array {
  if (left === false || right === false) return false
  if (left === true) return right
  if (right === true) return left
  const both = left.map((member, particle) => (member && right[particle] ? 1 : 0))
  return both.includes(1) ? both : false
}
