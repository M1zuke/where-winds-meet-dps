import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"
import { isInebriate } from "./inebriate"

// Talent "Inebriate Critical Enhancement", rank 3 at art level 100: up to
// +30% critical damage at 750 Min Physical Attack on Inebriate-enhanced
// skills (client talent row 320203, 2026-09-04), carried flat at the cap.
export const inebriateSkillCritDamage = defineClassBuff({
  id: BUFF.inebriateSkillCritDamage,
  name: "Inebriate Critical Enhancement",
  alwaysActive: true,
  duration: 9999,
  summary: "critDamageBoost +30% on Inebriate-enhanced skills while Inebriate",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx) ? [stat("critDamageBoost", 0.3)] : [],
})
