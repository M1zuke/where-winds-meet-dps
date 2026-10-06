import type { QiEdgeWarning } from "./types"

export const QI_EDGE_MARGIN_SEC = 0.5
export const QI_EDGE_MIN_SHARE_OF_TOTAL = 0.005

interface QiBreakFrames {
  startFrame: number
  endFrame: number
}

export interface QiEdgeSite {
  breakIndex: number
  edge: QiEdgeWarning["edge"]
  edgeFrame: number
  referenceFrame: number
  offsetFrames: number
}

export function qiEdgeSiteOf(
  frame: number,
  breaks: readonly QiBreakFrames[],
  fps: number,
): QiEdgeSite | null {
  const marginFrames = Math.round(QI_EDGE_MARGIN_SEC * fps)
  let nearest: QiEdgeSite | null = null
  for (const [breakIndex, { startFrame, endFrame }] of breaks.entries()) {
    const inside = frame >= startFrame && frame < endFrame
    const candidates: QiEdgeSite[] = [
      {
        breakIndex,
        edge: "start",
        edgeFrame: startFrame,
        referenceFrame: inside ? startFrame - 1 : startFrame,
        offsetFrames: frame - startFrame,
      },
      {
        breakIndex,
        edge: "end",
        edgeFrame: endFrame,
        referenceFrame: inside ? endFrame : endFrame - 1,
        offsetFrames: frame - endFrame,
      },
    ]
    for (const candidate of candidates) {
      if (Math.abs(candidate.offsetFrames) > marginFrames) continue
      if (!nearest || Math.abs(candidate.offsetFrames) < Math.abs(nearest.offsetFrames))
        nearest = candidate
    }
  }
  return nearest
}

interface EdgeDependence {
  skillName: string
  site: QiEdgeSite
  damageAtStake: number
}

export class QiEdgeDependence {
  private readonly bySkillAndEdge = new Map<string, EdgeDependence>()

  record(skillName: string, site: QiEdgeSite, damageDifference: number): void {
    if (damageDifference === 0) return
    const key = `${skillName}|${site.breakIndex}|${site.edge}`
    const existing = this.bySkillAndEdge.get(key)
    if (!existing) {
      this.bySkillAndEdge.set(key, {
        skillName,
        site,
        damageAtStake: Math.abs(damageDifference),
      })
      return
    }
    existing.damageAtStake += Math.abs(damageDifference)
    if (Math.abs(site.offsetFrames) < Math.abs(existing.site.offsetFrames)) existing.site = site
  }

  warnings(totalDamage: number, fps: number, fightStartSec: number): QiEdgeWarning[] {
    if (totalDamage <= 0) return []
    return [...this.bySkillAndEdge.values()]
      .filter(({ damageAtStake }) => damageAtStake / totalDamage >= QI_EDGE_MIN_SHARE_OF_TOTAL)
      .sort(
        (left, right) =>
          left.site.edgeFrame - right.site.edgeFrame || (left.skillName < right.skillName ? -1 : 1),
      )
      .map(({ skillName, site, damageAtStake }) => ({
        skillName,
        edge: site.edge,
        side: site.offsetFrames < 0 ? "before" : "after",
        offsetSec: Math.abs(site.offsetFrames) / fps,
        edgeSec: site.edgeFrame / fps - fightStartSec,
        shareOfTotal: damageAtStake / totalDamage,
      }))
  }
}
