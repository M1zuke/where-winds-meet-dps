import type { ScriptId } from "../../../engine/types"
import { BUFF } from "./ids"

export const SCRIPT_IDS: readonly ScriptId[] = [
  BUFF.opportunityScript,
  BUFF.detachmentScript,
  BUFF.insightScript,
  BUFF.wraithstrikeScript,
  BUFF.voidrotScript,
  BUFF.convergenceScript,
  BUFF.voidskyScript,
  BUFF.soullinkScript,
  BUFF.purewrathScript,
  BUFF.karmaScript,
  BUFF.chaosScript,
  BUFF.wavebornScript,
  BUFF.clearfallScript,
]

export const SCRIPT_LABEL_KEYS: Record<ScriptId, string> = {
  opportunityScript: "overview.encounterSettings.opportunityScript",
  detachmentScript: "overview.encounterSettings.detachmentScript",
  insightScript: "overview.encounterSettings.insightScript",
  wraithstrikeScript: "overview.encounterSettings.wraithstrikeScript",
  voidrotScript: "overview.encounterSettings.voidrotScript",
  convergenceScript: "overview.encounterSettings.convergenceScript",
  voidskyScript: "overview.encounterSettings.voidskyScript",
  soullinkScript: "overview.encounterSettings.soullinkScript",
  purewrathScript: "overview.encounterSettings.purewrathScript",
  karmaScript: "overview.encounterSettings.karmaScript",
  chaosScript: "overview.encounterSettings.chaosScript",
  wavebornScript: "overview.encounterSettings.wavebornScript",
  clearfallScript: "overview.encounterSettings.clearfallScript",
}

export const SCRIPT_MIN_BREAKTHROUGH: Record<ScriptId, number> = {
  opportunityScript: 14,
  detachmentScript: 14,
  insightScript: 14,
  wraithstrikeScript: 16,
  voidrotScript: 16,
  convergenceScript: 16,
  voidskyScript: 18,
  soullinkScript: 18,
  purewrathScript: 18,
  karmaScript: 20,
  chaosScript: 20,
  wavebornScript: 20,
  clearfallScript: 20,
}
