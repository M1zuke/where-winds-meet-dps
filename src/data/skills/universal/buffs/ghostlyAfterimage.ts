import { castSkill } from "../../../../definitions/skills/triggers"
import { BUFF } from "../../buffs/ids"
import { SKILL } from "../../mystic/ids"

export const GHOSTLY_AFTERIMAGE_TRIGGER = castSkill({
  target: SKILL.ghostlyAfterimage,
  conditions: [{ buffId: BUFF.ghostlyStepsUmbra, op: "gte", stacks: 1 }],
})
