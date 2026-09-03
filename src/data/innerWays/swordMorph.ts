import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { swordMorphEnduranceBoost } from "./swordMorphBuffs"
import { swordMorphExhaustedBehavior } from "./swordMorphExhausted"
import { SKILL } from "../skills/bellstrike-splendor/ids"

// Tier 3 and Tier 6 wording from the client localization (2026-08-15): the
// multiple sword energy attacks never Abrade an Exhausted unit and the third
// is a guaranteed Affinity hit against one; Tier 6 grants Energy Surge, which
// releases them again without charging.
export const swordMorph = defineInnerWay({
  id: INNER_WAY_ID.swordMorph,
  name: "Sword Morph",
  selectableTiers: [6, 5, 3],
  confirmedBreakthrough: 17,
  buffParam: PARAM.swordMorph,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.weaponAttackMaxFiveStar },
    3: { nodes: [INNER_WAY_NODE.exhaustedSwordEnergyOutcome] },
    5: { panelStats: { directAffinityRate: 0.023 } },
    6: { nodes: [INNER_WAY_NODE.energySurge] },
  },
  buffDefs: [swordMorphEnduranceBoost],
  skillBehaviors: [
    SKILL.swordHeavyCharged,
    SKILL.swordHeavyChargedPrepull,
    SKILL.swordHeavyCharged2Hit,
    SKILL.energySurge,
  ].map((skillId) => ({ skillId, factory: swordMorphExhaustedBehavior })),
})
