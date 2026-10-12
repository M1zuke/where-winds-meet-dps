import { runEngine } from "../src/engine/dps"
import { defaultInputs } from "../src/engine/defaults"
import { makeStep } from "../src/engine/rotation"
import { FPS } from "../src/engine/timeline"
import { PARAM } from "../src/data/skills/buffs/ids"
import { testRotation } from "./builtins"

export const DUST_CLASS = "bamboocutDust"

export type DustResult = ReturnType<typeof runDust>

export function runDust(skillIds: string[], buffParams: Record<string, unknown> = {}) {
  return runEngine({
    ...defaultInputs,
    classId: DUST_CLASS,
    buffParams,
    activeCustomRotation: testRotation(DUST_CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
  })
}

export function towlineSweepRank(tier: number): Record<string, unknown> {
  return { [PARAM.towlineSweep]: true, [`${PARAM.towlineSweep}Tier`]: tier }
}

export function windowFramesOf(result: DustResult, statusId: string) {
  return result
    .buffWindows!.filter((window) => window.id === statusId)
    .map((window) => ({
      start: Math.round(window.startSec * FPS),
      end: Math.round(window.endSec * FPS),
    }))
    .sort((left, right) => left.start - right.start)
}

export function coveredIntervals(result: DustResult, statusId: string) {
  const merged: { start: number; end: number }[] = []
  for (const window of windowFramesOf(result, statusId)) {
    const last = merged[merged.length - 1]
    if (last && window.start <= last.end) last.end = Math.max(last.end, window.end)
    else merged.push({ ...window })
  }
  return merged
}

export function damageFramesOf(result: DustResult, skillName: string) {
  return result
    .timeline!.filter((event) => event.skillName === skillName && event.damage > 0)
    .map((event) => event.frame)
}

export function stacksAfterCast(result: DustResult, castIndex: number, statusId: string) {
  return result.casts![castIndex].buffs.find((buff) => buff.id === statusId)?.stacks ?? 0
}
