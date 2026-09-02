import type { CombatSettings, QiBreakWindow } from "./types"

export const DEFAULT_QI_BREAK_WINDOW: QiBreakWindow = {
  startSec: 25,
  durationSec: 10,
  lowQiLeadSec: 5,
}

export function resolveQiBreakWindow(
  combatSettings: CombatSettings | undefined,
  rotationWindow: QiBreakWindow | undefined,
): QiBreakWindow {
  return combatSettings?.qiBreakOverride ?? rotationWindow ?? DEFAULT_QI_BREAK_WINDOW
}

export function sameQiBreakWindow(left: QiBreakWindow, right: QiBreakWindow): boolean {
  return (
    left.startSec === right.startSec &&
    left.durationSec === right.durationSec &&
    left.lowQiLeadSec === right.lowQiLeadSec
  )
}
