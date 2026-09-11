export interface ArtAttackStage {
  min: number
  max: number
}

// In-game martial-art stage attack values as of 2026-09-11.
export const SHARED_ART_ATTACK_LADDER: Readonly<Record<number, ArtAttackStage>> = {
  13: { min: 98, max: 196 },
  18: { min: 106, max: 212 },
  19: { min: 114, max: 228 },
  20: { min: 123, max: 246 },
  21: { min: 133, max: 266 },
}

const ART_ATTACK_LADDER_BY_CLASS: Readonly<
  Record<string, Readonly<Record<number, ArtAttackStage>>>
> = {
  bamboocutDraught: {
    ...SHARED_ART_ATTACK_LADDER,
    22: { min: 143, max: 286 },
    23: { min: 153, max: 306 },
  },
}

export function artAttackStageAt(classId: string, breakthrough: number): ArtAttackStage {
  const ladder = ART_ATTACK_LADDER_BY_CLASS[classId] ?? SHARED_ART_ATTACK_LADDER
  const keys = Object.keys(ladder)
    .map(Number)
    .sort((left, right) => left - right)
  const atOrBelow = keys.filter((key) => key <= breakthrough)
  const resolvedKey = atOrBelow.length > 0 ? atOrBelow[atOrBelow.length - 1]! : keys[0]!
  return ladder[resolvedKey]!
}
