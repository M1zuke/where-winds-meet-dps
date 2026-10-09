import { defineGateBuff } from "../../../../definitions/skills/skillDef"
import { applyBuff } from "../../../../definitions/skills/triggers"
import type { Buff } from "../../../../engine/buff"
import { BUFF } from "../../buffs/ids"

export const GHOSTLY_STEPS_UMBRA_GATE: Buff = defineGateBuff({
  id: BUFF.ghostlyStepsUmbra,
  classId: "universal",
  name: "Ghostly Steps - Umbra",
  description: "Perfect dodges leave an afterimage for 30s.",
  scope: "player",
  activation: "triggered",
  durationFrames: 1800,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})

export const ghostlyStepsUmbraGrant = applyBuff({ target: BUFF.ghostlyStepsUmbra })
