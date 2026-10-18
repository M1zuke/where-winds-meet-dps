// Ground distance to a stationary target, simulated once per cast — see
// docs/TIMELINE.md § "Target distance". Pure functions only: the timeline
// owns the sequencing, this module only owns the per-cast arithmetic.

export type SkillApproach = "approach" | "stationary"

// 40 m matches the longest `reachMeters` authored on any skill so far (the
// mystic Flute of the Tides casts).
export const PREFERRED_DISTANCE_METERS_MIN = 0
export const PREFERRED_DISTANCE_METERS_MAX = 40
export const DEFAULT_PREFERRED_DISTANCE_METERS = 3

export function isValidPreferredDistanceMeters(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= PREFERRED_DISTANCE_METERS_MIN &&
    value <= PREFERRED_DISTANCE_METERS_MAX
  )
}

export const CONTACT_METERS = 1

export type RootMotionKey = readonly [frame: number, meters: number]

export interface DistanceBand {
  minMeters: number
  maxMeters: number
  then: Displacement
}

export type Displacement =
  | { kind: "towardTarget"; referenceMeters: number }
  | { kind: "toTarget"; meters: number }
  | { kind: "selfForward"; meters: number }
  | { kind: "rootMotion"; metersAtFrame: readonly RootMotionKey[]; throughTarget?: boolean }
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

export function rootMotionMetersAt(keys: readonly RootMotionKey[], frame: number): number {
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (!first || !last) return 0
  if (frame <= first[0]) return first[1]
  if (frame >= last[0]) return last[1]
  const upperIndex = keys.findIndex(([keyFrame]) => keyFrame >= frame)
  const [upperFrame, upperMeters] = keys[upperIndex]!
  const [lowerFrame, lowerMeters] = keys[upperIndex - 1]!
  if (upperFrame === lowerFrame) return upperMeters
  const progress = (frame - lowerFrame) / (upperFrame - lowerFrame)
  return lowerMeters + (upperMeters - lowerMeters) * progress
}

export function applyDisplacement(
  displacement: Displacement | undefined,
  distanceMeters: number,
  atFrame = Infinity,
): number {
  if (!displacement) return distanceMeters
  switch (displacement.kind) {
    case "towardTarget":
      return Math.max(0, distanceMeters - displacement.referenceMeters)
    case "toTarget":
      return displacement.meters
    case "selfForward":
      return Math.abs(distanceMeters - displacement.meters)
    case "rootMotion": {
      const movedMeters = rootMotionMetersAt(displacement.metersAtFrame, atFrame)
      if (displacement.throughTarget) return Math.abs(distanceMeters - movedMeters)
      if (movedMeters > 0)
        return Math.max(distanceMeters - movedMeters, Math.min(distanceMeters, CONTACT_METERS))
      return distanceMeters - movedMeters
    }
    case "byDistance": {
      const band = displacement.bands.find(
        (candidate) =>
          distanceMeters >= candidate.minMeters && distanceMeters <= candidate.maxMeters,
      )
      return applyDisplacement(band ? band.then : displacement.otherwise, distanceMeters, atFrame)
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

export function distanceReaderAtCast(
  skill: DistanceSkill,
  defaultMeleeReachMeters: number,
  preferredMeters: number,
  currentMeters: number,
): (castFrame: number) => number {
  const afterApproach = distanceAfterApproach(
    skill,
    defaultMeleeReachMeters,
    preferredMeters,
    currentMeters,
  )
  return (castFrame) => applyDisplacement(skill.displacement, afterApproach, castFrame)
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
    case "rootMotion":
      return (
        Array.isArray(record.metersAtFrame) &&
        record.metersAtFrame.length > 0 &&
        record.metersAtFrame.every(
          (key, index, keys) =>
            Array.isArray(key) &&
            key.length === 2 &&
            isFiniteNumber(key[0]) &&
            isFiniteNumber(key[1]) &&
            (index === 0 || key[0] >= (keys[index - 1] as RootMotionKey)[0]),
        ) &&
        (record.throughTarget === undefined || typeof record.throughTarget === "boolean")
      )
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
