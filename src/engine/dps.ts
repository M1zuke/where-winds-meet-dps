import type { EngineRunOptions, Inputs, Result } from "./types"
import { simulateTimeline } from "./timeline"
import { activeRotationForInputs } from "./activeRotation"
import { rememberedPass } from "./passMemo"
import { withDerivedStats } from "./derivedInputs"
import { applySetBonuses } from "./setBonuses"
import { graduationQiSourceInputs } from "./graduation"
import type { QiDamageLog } from "./qiBar"

export const TOTALS_RUN: EngineRunOptions = { collect: "totals" }

export function qiDamageLogOfSource(source: Inputs): QiDamageLog | null {
  return runEngine(applySetBonuses(withDerivedStats(source)), TOTALS_RUN).qiDamageLog ?? null
}

export function graduationQiDamageLog(inputs: Inputs): QiDamageLog | null {
  const source = graduationQiSourceInputs(inputs)
  return source ? qiDamageLogOfSource(source) : null
}

export function runEngine(inputs: Inputs, options?: EngineRunOptions): Result {
  return rememberedPass(inputs, options, () =>
    computePass(inputs, withResolvedQiSource(inputs, options)),
  )
}

function withResolvedQiSource(
  inputs: Inputs,
  options: EngineRunOptions | undefined,
): EngineRunOptions | undefined {
  if (options?.qiDamageLog || options?.fixedQiBreaks || options?.qiBar === "own") return options
  const qiDamageLog = graduationQiDamageLog(inputs)
  return qiDamageLog ? { ...options, qiDamageLog } : options
}

function computePass(inputs: Inputs, options: EngineRunOptions | undefined): Result {
  const rotation = activeRotationForInputs(inputs)
  if (!rotation) {
    return {
      dps: 0,
      totalDamage: 0,
      rotationDuration: 0,
      fightStartSec: 0,
      castDuration: 0,
      graduationRate: null,
      perSkill: [],
      ranking: [],
      warnings: [`No default rotation for ${inputs.classId}.`],
    }
  }
  return simulateTimeline({ ...inputs, activeCustomRotation: rotation }, options)
}
