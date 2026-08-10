import type { SetDef } from "./define"
import { hawking } from "./hawking"
import { jadeware } from "./jadeware"
import { ivorybloom } from "./ivorybloom"
import { rainwhisper } from "./rainwhisper"
import { rainwhisperNoShield } from "./rainwhisperNoShield"
import { swallowcall } from "./swallowcall"
import { swiftGale } from "./swiftGale"
import { swayingHeights } from "./swayingHeights"
import { mistwillow } from "./mistwillow"
import { starsAlign } from "./starsAlign"
import { shatteredRidge } from "./shatteredRidge"

export type { SetDef, SetFormulaBonus, SetPanelBonus } from "./define"
export { SET_ID } from "./ids"

export const SET_DEFS: readonly SetDef[] = [
  hawking,
  jadeware,
  ivorybloom,
  rainwhisper,
  rainwhisperNoShield,
  swallowcall,
  swiftGale,
  swayingHeights,
  mistwillow,
  starsAlign,
  shatteredRidge,
]

export const SET_BY_ID: Readonly<Record<string, SetDef>> = Object.fromEntries(
  SET_DEFS.map((set) => [set.id, set]),
)

export function setDisplayNameForSiteKey(siteKey: string): string | undefined {
  return SET_DEFS.find((set) => set.siteKey === siteKey)?.name
}
