// Ground distance to a stationary target, simulated once per cast — see
// docs/TIMELINE.md § "Target distance". Pure functions only: the layout pass
// owns the sequencing, this module only owns the per-cast arithmetic.

export type SkillApproach = "approach" | "stationary"

export interface DistanceBand {
  minMeters: number
  maxMeters: number
  then: Displacement
}

export type Displacement =
  | { kind: "towardTarget"; referenceMeters: number }
  | { kind: "toTarget"; meters: number }
  | { kind: "selfForward"; meters: number }
  | { kind: "byDistance"; bands: readonly DistanceBand[]; otherwise: Displacement }

export interface DistanceSkill {
  reachMeters?: number
  approach?: SkillApproach
  displacement?: Displacement
}

export function reachMetersOf(skill: DistanceSkill, defaultMeleeReachMeters: number): number {
  return skill.reachMeters ?? defaultMeleeReachMeters
}

export function distanceAfterApproach(
  skill: DistanceSkill,
  defaultMeleeReachMeters: number,
  preferredMeters: number,
  currentMeters: number,
): number {
  const reach = reachMetersOf(skill, defaultMeleeReachMeters)
  return skill.approach === "stationary"
    ? Math.min(currentMeters, reach)
    : Math.min(preferredMeters, reach)
}

export function applyDisplacement(
  displacement: Displacement | undefined,
  distanceMeters: number,
): number {
  if (!displacement) return distanceMeters
  switch (displacement.kind) {
    case "towardTarget":
      return Math.max(0, distanceMeters - displacement.referenceMeters)
    case "toTarget":
      return displacement.meters
    case "selfForward":
      return Math.abs(distanceMeters - displacement.meters)
    case "byDistance": {
      const band = displacement.bands.find(
        (candidate) =>
          distanceMeters >= candidate.minMeters && distanceMeters <= candidate.maxMeters,
      )
      return applyDisplacement(band ? band.then : displacement.otherwise, distanceMeters)
    }
  }
}

export function distanceAtCastStart(
  skill: DistanceSkill,
  defaultMeleeReachMeters: number,
  preferredMeters: number,
  currentMeters: number,
): number {
  const afterApproach = distanceAfterApproach(
    skill,
    defaultMeleeReachMeters,
    preferredMeters,
    currentMeters,
  )
  return applyDisplacement(skill.displacement, afterApproach)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

export function isDisplacement(value: unknown): value is Displacement {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  switch (record.kind) {
    case "towardTarget":
      return isFiniteNumber(record.referenceMeters)
    case "toTarget":
    case "selfForward":
      return isFiniteNumber(record.meters)
    case "byDistance":
      return (
        Array.isArray(record.bands) &&
        record.bands.every(
          (band) =>
            !!band &&
            typeof band === "object" &&
            isFiniteNumber((band as Record<string, unknown>).minMeters) &&
            isFiniteNumber((band as Record<string, unknown>).maxMeters) &&
            isDisplacement((band as Record<string, unknown>).then),
        ) &&
        isDisplacement(record.otherwise)
      )
    default:
      return false
  }
}

export function isSkillApproach(value: unknown): value is SkillApproach {
  return value === "approach" || value === "stationary"
}
