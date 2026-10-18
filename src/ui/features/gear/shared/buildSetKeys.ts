import type { Arsenal, BowSet } from "../../../../engine/types"

export const BOW_SET_KEYS: Readonly<Record<Exclude<BowSet, null>, string>> = {
  affinity: "common.affinity",
  crit: "common.crit",
  precision: "common.precision",
}

export const BOW_SET_NAME_KEYS: Readonly<Record<Exclude<BowSet, null>, string>> = {
  precision: "common.precision",
  crit: "common.critical",
  affinity: "common.affinity",
}

export const ARSENAL_KEYS: Readonly<Record<Arsenal, string>> = {
  general: "common.generalArsenal",
  bellstrike: "common.bellstrikeArsenal",
  stonesplit: "common.stonesplitArsenal",
  silkbind: "common.silkbindArsenal",
  bamboocut: "common.bamboocutArsenal",
}
