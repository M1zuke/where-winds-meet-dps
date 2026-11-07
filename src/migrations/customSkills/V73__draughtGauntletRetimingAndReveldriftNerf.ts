// v72 → v73 — Reveldrift deals half its damage (both hits: 0.528025 / 0.7920375
// / 146.5 / 80 became 0.2640125 / 0.39601875 / 73.25 / 40) and its first hit
// lands on frame 20 (was 19). Castlink casts in 44 frames (was 49) and hits on
// 21 / 34 (was 15 / 27), its Jadeflush form on 20 / 31 / 43 / 73 (was 15 / 27 /
// 41 / 74). Peakfall hits on 20 / 34 (was 18 / 35). The Primepick follow-up
// cancel form casts in 36 frames (was 39). Grounddrift hits on 15 / 29 / 54 / 80
// (was 8 / 24 / 56 / 88), Bloombreak's first stage on 14 (was 12), the gauntlet
// Dual-Weapon Skill on 17 / 40 (was 14 / 37) and the plain gauntlet light attack's
// first stage on 17 (was 13). A Skill Editor copy seeded before this still
// carries the old values. Only a value still identical to what was seeded is
// rewritten: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

type Rewrite = readonly [from: number, to: number]

interface HitRewrite {
  frame?: Rewrite
  coefficients?: Partial<
    Record<"physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed", Rewrite>
  >
  variantFrames?: readonly number[]
}

interface SkillRewrite {
  castFrames?: Rewrite
  hits: readonly (HitRewrite | null)[]
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const HALVED_REVELDRIFT = {
  physMultiplier: [0.528025, 0.2640125],
  attributeMultiplier: [0.7920375, 0.39601875],
  physFixed: [146.5, 73.25],
  attributeFixed: [80, 40],
} as const

const REWRITES: Readonly<Record<string, SkillRewrite>> = {
  "bamboocutDraught-reveldrift": {
    hits: [
      { frame: [19, 20], coefficients: HALVED_REVELDRIFT },
      { coefficients: HALVED_REVELDRIFT },
    ],
  },
  "bamboocutDraught-reveldrift-cancel": {
    hits: [{ frame: [19, 20], coefficients: HALVED_REVELDRIFT }],
  },
  "bamboocutDraught-castlink": {
    castFrames: [49, 44],
    hits: [
      { frame: [15, 21], variantFrames: [20] },
      { frame: [27, 34], variantFrames: [31] },
      { frame: [41, 43] },
      { frame: [74, 73] },
    ],
  },
  "bamboocutDraught-peakfall": {
    hits: [{ frame: [18, 20] }, { frame: [35, 34] }],
  },
  "bamboocutDraught-nightwick-primepick-follow-up-cancel": {
    castFrames: [39, 36],
    hits: [],
  },
  "bamboocutDraught-nightwick-grounddrift": {
    hits: [{ frame: [8, 15] }, { frame: [24, 29] }, { frame: [56, 54] }, { frame: [88, 80] }],
  },
  "bamboocutDraught-bloombreak": {
    hits: [{ frame: [12, 14] }],
  },
  "bamboocutDraught-gauntlets-dual": {
    hits: [{ frame: [14, 17] }, { frame: [37, 40] }],
  },
  "bamboocutDraught-light-attack": {
    hits: [{ frame: [13, 17] }],
  },
}

const rewritten = (value: unknown, [from, to]: Rewrite): unknown => (value === from ? to : value)

const withVariantFrames = (variants: unknown, variantFrames: readonly number[]): unknown =>
  Array.isArray(variants)
    ? variants.map((variant, index) =>
        isRecord(variant) && variant.frame === undefined && variantFrames[index] !== undefined
          ? { ...variant, frame: variantFrames[index] }
          : variant,
      )
    : variants

function healHit(hit: unknown, rewrite: HitRewrite | null | undefined): unknown {
  if (!isRecord(hit) || !rewrite) return hit
  const healed: RecordValue = { ...hit }
  if (rewrite.frame && hit.frame === rewrite.frame[0]) {
    healed.frame = rewrite.frame[1]
    if (rewrite.variantFrames && "variants" in hit) {
      healed.variants = withVariantFrames(hit.variants, rewrite.variantFrames)
    }
  }
  for (const [field, rewriteRule] of Object.entries(rewrite.coefficients ?? {})) {
    healed[field] = rewritten(hit[field], rewriteRule)
  }
  return healed
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const rewrite = REWRITES[skill.id]
  if (!rewrite) return skill
  const healed: RecordValue = {
    ...skill,
    hits: skill.hits.map((hit, index) => healHit(hit, rewrite.hits[index])),
  }
  if (rewrite.castFrames) healed.castFrames = rewritten(skill.castFrames, rewrite.castFrames)
  return healed
}

export const V73__draughtGauntletRetimingAndReveldriftNerf: CustomSkillMigration = {
  to: 73,
  name: "V73__draughtGauntletRetimingAndReveldriftNerf",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 73, skills }
  },
}
