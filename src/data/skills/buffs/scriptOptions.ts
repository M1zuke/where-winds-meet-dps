import type { ScriptId } from "../../../engine/types"
import { BUFF } from "./ids"

export const SCRIPT_IDS: readonly ScriptId[] = [BUFF.wraithstrikeScript, BUFF.voidrotScript]

export const SCRIPT_LABEL_KEYS: Record<ScriptId, string> = {
  wraithstrikeScript: "overview.encounterSettings.wraithstrikeScript",
  voidrotScript: "overview.encounterSettings.voidrotScript",
}
