import type { Inputs } from "./types"
import { buildContext } from "./panel"
import { computeSkillDamage } from "./formula"

type Art = Parameters<typeof computeSkillDamage>[0]

export type ArtPatch = Record<string, number | string>

export function resolveArt(name: string, livePatch?: ArtPatch): Art | undefined {
  if (!livePatch) return undefined
  return { ...(livePatch as Partial<Art>), name } as Art
}

export interface SkillPreview {
  abrasion: number
  normal: { min: number; max: number }
  crit: { min: number; max: number }
  affinity: number
}

export function computeSkillPreview(
  skillName: string,
  inputs: Inputs,
  livePatch?: ArtPatch,
): SkillPreview | null {
  const ctx = buildContext(inputs)
  const art = resolveArt(skillName, livePatch)
  if (!art) return null
  const { cells: c } = computeSkillDamage(art, ctx, 1)
  const bm = (1 + c.H) * (c.I || 1) * (1 + c.E)
  return {
    abrasion: c.DZ * bm,
    normal: { min: c.normalMin * bm, max: c.normalMax * bm },
    crit: { min: c.critMin * bm, max: c.critMax * bm },
    affinity: c.ED * bm,
  }
}
