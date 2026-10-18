import { BuffEngine, type BuffParams } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { ScriptedQiBar, type QiReader } from "../../src/engine/qiBar"
import type { QiBreakWindow } from "../../src/engine/types"

export const DEFAULT_QI_BREAK_WINDOW: QiBreakWindow = {
  startSec: 25,
  durationSec: 10,
  lowQiLeadSec: 5,
}

const FPS = 60

export function scriptedQiBar(...windows: readonly QiBreakWindow[]): ScriptedQiBar {
  return new ScriptedQiBar(windows, FPS)
}

export function exhaustedFrom(startSec: number, durationSec: number): ScriptedQiBar {
  return scriptedQiBar({ startSec, durationSec, lowQiLeadSec: 0 })
}

export function buffEngineWith(
  params: BuffParams,
  modules: readonly BuffModule[],
  groupModules: readonly BuffModule[] = [],
  qiReader: QiReader = scriptedQiBar(),
): BuffEngine {
  return new BuffEngine(params, qiReader, modules, groupModules)
}
