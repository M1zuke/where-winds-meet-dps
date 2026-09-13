export interface ResourceGainRule {
  id: string
  name: string
  defaultAmount: number
  tag?: string
  skillIds?: readonly string[]
  oncePerCast?: boolean
  divideAcrossSkillHits?: boolean
  requiresParam?: string
  minTier?: number
  requiresBuff?: string
}

export interface ResourceDef {
  id: string
  name: string
  capacity: number
  launchMinimum: number
  defaultOpening: number
  defaultExhaustedGainPerTick?: number
  launchSkillId: string
  debuffId: string
  drainPerSecond: number
  enhancedBuffId: string
  enhancedExtraDrainPerSecond: number
  endRefund: number
  refundCooldownSeconds: number
  gains: readonly ResourceGainRule[]
}

export interface ResourceSettings {
  opening: number
  gains: Record<string, number>
  exhaustedGainPerTick: number
}

export function defineResource<const Definition extends ResourceDef>(
  definition: Definition,
): Definition {
  return definition
}

export function resolveResourceSettings(
  definition: ResourceDef,
  raw?: Partial<ResourceSettings>,
): ResourceSettings {
  const finite = (value: unknown, fallback: number, maximum: number) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, Math.min(maximum, value))
      : fallback
  return {
    opening: finite(raw?.opening, definition.defaultOpening, definition.capacity),
    gains: Object.fromEntries(
      definition.gains.map((rule) => [
        rule.id,
        finite(raw?.gains?.[rule.id], rule.defaultAmount, definition.capacity),
      ]),
    ),
    exhaustedGainPerTick: finite(
      raw?.exhaustedGainPerTick,
      definition.defaultExhaustedGainPerTick ?? 0,
      definition.capacity,
    ),
  }
}
