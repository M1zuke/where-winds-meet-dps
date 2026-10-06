import { applyDebuff } from "../../../../definitions/skills/triggers"
import { BUFF } from "../../buffs/ids"
import { DEBUFF } from "../../mystic/ids"

export const GHOSTLY_AFTERIMAGE_TRIGGER = applyDebuff({
  target: DEBUFF.ghostlyAfterimage,
  conditions: [{ buffId: BUFF.ghostlyStepsUmbra, op: "gte", stacks: 1 }],
})
