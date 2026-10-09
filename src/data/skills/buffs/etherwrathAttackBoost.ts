import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { artBonus } from "../../../engine/effects/effect"
import { etherwrath } from "../../sets/etherwrath"

const DURATION_SEC = 8.1
const MAX_STACKS = 5
const PER_STACK = 0.01

// "Hitting a boss or player grants Etherwrath: Increases all types of Attack
// by 1% (including Physical Attack and all Attribute Attacks) for 8s,
// stacking up to 5 times." (in-game data, 2026-09-24 — the tooltip's own text
// says 1.2%; the data wins.) The 5-stacks-only attribute penetration on a
// handful of Martial Art assist hits (falcon, Anxi soldiers, …) is not
// modelled.
export const etherwrathAttackBoost = defineBuff({
  id: BUFF.etherwrathAttackBoost,
  name: "Etherwrath",
  requires: { set: etherwrath.siteKey },
  affectsAll: true,
  duration: DURATION_SEC,
  maxStacks: MAX_STACKS,
  stackOnDamage: true,
  summary: "physical/attribute attack +1%/stack (max 5)",
  effects: (ctx) => {
    const bonus = PER_STACK * ctx.self.stacks
    return [
      artBonus("minPhysPctBonus", bonus),
      artBonus("maxPhysPctBonus", bonus),
      artBonus("attributeAttackPctBonus", bonus),
    ]
  },
})
