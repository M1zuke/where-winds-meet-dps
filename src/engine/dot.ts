import type { Debuff, DebuffDotSpec, DotStackShape } from "./debuff"
import type { Skill } from "./skill"
import type { StatusWindow } from "./ledger"
import type { computeSkillDamage, FormulaContext, RolledHit } from "./formula"
import { attuneTagOf, mysticCategoryOf } from "./buffs/tags"

type ArtRow = Parameters<typeof computeSkillDamage>[0]

const DEBUFF_ID_PREFIX = "debuff-"

// A debuff names the skill its per-tick coefficients come from. `sourceSkillId`
// is authored; absent, the id convention is used — `debuff-<classId>-<slug>`
// ticks from `<classId>-<slug>` (CLASSES.md § "Id schemes").
export function tickSourceSkillId(debuff: Debuff): string | null {
  if (debuff.dot?.sourceSkillId) return debuff.dot.sourceSkillId
  return debuff.id.startsWith(DEBUFF_ID_PREFIX) ? debuff.id.slice(DEBUFF_ID_PREFIX.length) : null
}

// The tick's coefficients are the source skill's first hit when there is one,
// so editing that skill in the Skill Editor moves its DoT.
export function resolveTickDot(debuff: Debuff, tickSkill: Skill | undefined): DebuffDotSpec | null {
  const base = debuff.dot
  if (!base) return null
  const sourceHit = tickSkill?.hits[0]
  if (!sourceHit || !tickSkill) return base
  return {
    ...base,
    physMultiplier: sourceHit.physMultiplier,
    physFixed: sourceHit.physFixed,
    attributeMultiplier: sourceHit.attributeMultiplier,
    attributeFixed: sourceHit.attributeFixed,
    attributeAttack: (tickSkill.attributeAttack ||
      base.attributeAttack) as DebuffDotSpec["attributeAttack"],
    weaponOrAttribute: tickSkill.weaponOrAttribute || null,
    mysticCategory: mysticCategoryOf(tickSkill) || null,
    attuneTag: attuneTagOf(tickSkill) || null,
  }
}

export function dotRowName(debuff: Pick<Debuff, "name">): string {
  return `${debuff.name} (DoT)`
}

// A tick is evaluated as a synthetic one-off skill. Without the source skill's
// and the debuff's tags it would carry nothing but its own display name, which
// is what forced every DoT-targeted modifier to address it by name.
export function dotTickSkill(debuff: Debuff, tickSkill?: Skill): Skill {
  return {
    id: `dot-${debuff.id}`,
    classId: debuff.classId,
    name: debuff.name,
    tags: [...new Set([...(tickSkill?.tags ?? []), ...(debuff.tags ?? [])])],
    receives: [...new Set([...(tickSkill?.receives ?? []), ...(debuff.receives ?? [])])],
    skillType: debuff.dot?.skillType || "sustain",
    weaponOrAttribute: "",
    attributeAttack: "",
    hits: [],
    castFrames: 0,
    triggerable: false,
    createdAt: debuff.createdAt,
    updatedAt: debuff.updatedAt,
  }
}

function tickArt(
  dot: DebuffDotSpec,
  name: string,
  shape: DotStackShape,
  forceCrit: boolean,
): ArtRow {
  return {
    name,
    physMultiplier: shape.physMultiplier,
    physFixed: shape.physFixed,
    attributeMultiplier: shape.attributeMultiplier,
    attributeFixed: shape.attributeFixed,
    attributeAttack: dot.attributeAttack || undefined,
    skillType: dot.skillType || "sustain",
    specialTag: "sustain",
    elevatedAttributeMultiplier: false,
    guaranteedCrit: forceCrit ? 1 : undefined,
    weaponOrAttribute: dot.weaponOrAttribute || undefined,
    mysticCategory: dot.mysticCategory || undefined,
    attuneTag: dot.attuneTag || undefined,
  } as ArtRow
}

export function dotTickDamage(
  debuff: Debuff,
  ctx: FormulaContext,
  compute: typeof computeSkillDamage,
  forceCrit = false,
  shape?: DotStackShape,
  rng?: () => number,
): { damage: number; rolled?: RolledHit } {
  const dot = debuff.dot
  if (!dot) return { damage: 0 }
  const resolved = shape ?? {
    physMultiplier: dot.physMultiplier,
    physFixed: dot.physFixed,
    attributeMultiplier: dot.attributeMultiplier,
    attributeFixed: dot.attributeFixed,
  }
  const art = tickArt(dot, debuff.name, resolved, forceCrit)
  const { expectedDamage, rolled } = compute(art, ctx, Math.max(1, dot.count), rng)
  return { damage: rolled?.damage ?? expectedDamage, rolled }
}

// Overlapping windows are one continuous episode: a DoT refreshed mid-window
// keeps ticking on the original grid rather than restarting it.
export function mergeEpisodes(windows: readonly StatusWindow[]): StatusWindow[] {
  const episodes: StatusWindow[] = []
  for (const window of windows) {
    const last = episodes[episodes.length - 1]
    if (last && window.start < last.end) last.end = Math.max(last.end, window.end)
    else episodes.push({ start: window.start, end: window.end })
  }
  return episodes
}

export interface DotTickPlan {
  frame: number
  weight: number
  shape?: DotStackShape
  scale?: number
}

export interface DotPlanQuery {
  debuff: Debuff
  dot: DebuffDotSpec
  windows: readonly StatusWindow[]
  stacksAt(frame: number): number
  inWindow(frame: number): boolean
  // Expected uptime for a stochastic DoT: a tick is worth the probability the
  // debuff is actually up at that moment. 1 for a deterministic one.
  weightAt(frame: number): number
}

export function planDotTicks(query: DotPlanQuery): DotTickPlan[] {
  const { debuff, dot } = query
  const interval = dot.tickIntervalFrames
  if (interval <= 0) return []

  const perStack = (debuff.stackScaling ?? "flat") === "perStack"
  const shapes = dot.perStackShapes?.length ? dot.perStackShapes : null
  const ladder = !shapes && dot.perStackMultipliers?.length ? dot.perStackMultipliers : null

  const plans: DotTickPlan[] = []
  for (const episode of mergeEpisodes(query.windows)) {
    for (let frame = episode.start + interval; frame < episode.end; frame += interval) {
      if (frame < 0 || !query.inWindow(frame)) continue
      const weight = query.weightAt(frame)
      if (weight <= 0) continue

      if (shapes) {
        const live = Math.max(1, query.stacksAt(frame))
        plans.push({ frame, weight, shape: shapes[Math.min(live, shapes.length) - 1] })
      } else if (ladder) {
        const live = Math.max(0, query.stacksAt(frame))
        if (live === 0) continue
        plans.push({ frame, weight, scale: ladder[Math.min(live, ladder.length) - 1] })
      } else {
        const count = perStack ? Math.max(0, query.stacksAt(frame)) : 1
        if (perStack && count === 0) continue
        plans.push({ frame, weight, scale: count })
      }
    }
  }
  return plans
}
